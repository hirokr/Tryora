"""
try_on_task.py — Celery task: 3-D try-on pipeline
---------------------------------------------------
Pipeline (10 steps):
  1. Validate job & load profile
  2. Classify body label from profile measurements
  3. Select best dress template (3-tier lookup)
  4. Check GLB cache (Redis → S3)
  5. If cache miss → call Tripo AI: base avatar generation
  6. Poll until base avatar ready, download GLB
  7. Cache base avatar GLB (Redis + S3)
  8. Compose (merge) base avatar + dress template GLB
  9. Upload result to S3
 10. Mark job COMPLETED, publish job_done event
"""
from __future__ import annotations

import asyncio
import json
import logging
from datetime import datetime, timezone
from typing import Any

from celery import Task

from app.worker.celery_app import celery_app

logger = logging.getLogger("worker.try_on")

# ---------------------------------------------------------------------------
# Helpers — async wrappers run via asyncio.run() inside the sync Celery task
# ---------------------------------------------------------------------------


async def _run_pipeline(job_id: str, user_id: str) -> None:  # noqa: C901
    from app.core.config import settings
    from app.db.prisma_connect import db
    from app.db.queries.jobs import get_job_by_id
    from app.db.queries.profile import get_profile
    from app.services.body_classifier import classify_body_label
    from app.services.cache import CacheService
    from app.services.consent_service import check_all_consents
    from app.services.job_service import update_job_status
    from app.services.s3_service import s3_service
    from app.services.template_selector import select_best_template
    from app.services.tripo_client import OfflineModeError, TripoAPIError, TripoTaskFailed, tripo_client

    redis_client = None
    cache = None

    try:
        import redis.asyncio as aioredis

        redis_client = aioredis.from_url(settings.REDIS_URL, decode_responses=False)
        cache = CacheService(redis_client)
    except Exception as exc:
        logger.warning("Redis unavailable in worker: %s", exc)

    async def _progress(step: int, total: int = 10, message: str = "") -> None:
        if cache:
            await update_job_status(
                job_id=job_id,
                status="PROCESSING",
                db=db,
                cache=cache,
                extra={"progress": round(step / total * 100), "step": message},
            )

    # ── Step 1: load job & validate ─────────────────────────────────────────
    await _progress(1, message="Loading job")
    if not db.is_connected():
        await db.connect()

    job = await get_job_by_id(job_id, user_id, db)
    if not job:
        logger.error("Job %s not found for user %s", job_id, user_id)
        return

    # ── Step 2: load profile & classify body ────────────────────────────────
    await _progress(2, message="Loading profile")
    profile = await get_profile(user_id, db)
    if not profile or profile.tHeight is None or profile.tFullness is None:
        await update_job_status(
            job_id=job_id,
            status="FAILED",
            db=db,
            cache=cache,
            extra={"error": "Body measurements (tHeight/tFullness) required. Update your profile."},
        )
        return

    body_label = classify_body_label(profile.tHeight, profile.tFullness)

    # ── Step 3: select dress template ───────────────────────────────────────
    await _progress(3, message="Selecting template")
    consent_given = profile.consentGiven or False
    ethnicity = profile.ethnicity if consent_given else None

    template = None
    dress_source_uri: str | None = None

    if job.templateDressId:
        from app.db.queries.templates import get_template_by_id
        template = await get_template_by_id(job.templateDressId, db)
        if template:
            dress_source_uri = template.glbSource or None
    elif job.userImageS3Key:
        # Will generate a custom GLB from the user-uploaded image
        dress_source_uri = f"s3:{settings.S3_BUCKET}/{job.userImageS3Key}"
    else:
        # Auto-select from catalog
        template = await select_best_template(
            user_id=user_id,
            body_label=body_label,
            category="CASUAL",
            ethnicity=ethnicity,
            consent_given=consent_given,
            db=db,
            cache=cache,
        )
        if template:
            dress_source_uri = template.glbSource or None

    if not dress_source_uri and not job.userImageS3Key:
        await update_job_status(
            job_id=job_id,
            status="FAILED",
            db=db,
            cache=cache,
            extra={"error": "No dress source available and no template found for body type"},
        )
        return

    # ── Step 4: cache check ─────────────────────────────────────────────────
    await _progress(4, message="Checking cache")
    result_cache_key = None
    if cache:
        result_cache_key = cache.key_result(user_id, job_id)
        cached_glb = await cache.get_glb(result_cache_key)
        if cached_glb:
            logger.info("Cache hit for job %s — skipping generation", job_id)
            await _finish_from_bytes(job_id, user_id, cached_glb, db, cache, s3_service, settings)
            return

    # ── Step 5-6: Tripo AI — base avatar or dress generation ────────────────
    await _progress(5, message="Calling Tripo AI")
    glb_bytes: bytes | None = None

    try:
        if job.userImageS3Key:
            # Download user's dress image from S3, get a public temp URL, pass to Tripo
            image_bytes = await s3_service.download_bytes(job.userImageS3Key)
            if not image_bytes:
                raise ValueError("User image not found in S3")

            # Upload to a short-lived public S3 key for Tripo
            temp_key = f"temp-tripo/{job_id}.jpg"
            await s3_service.upload_bytes(image_bytes, temp_key, "image/jpeg")
            image_url = await s3_service.generate_presigned_url(temp_key, ttl=600)

            task_id = await tripo_client.image_to_3d(image_url)
        else:
            # Build Tripo request from template thumbnail
            if template and template.thumbnailUrl:
                task_id = await tripo_client.image_to_3d(template.thumbnailUrl)
            else:
                raise ValueError("No image source for Tripo generation")

        # ── Step 6: poll Tripo ───────────────────────────────────────────────
        await _progress(6, message="Waiting for generation")
        result = await tripo_client.poll_until_done(task_id, max_wait=300, interval=5)

        glb_url = result.get("output", {}).get("pbr_model") or result.get("output", {}).get("model")
        if not glb_url:
            raise TripoTaskFailed(task_id, "No model URL in Tripo result")

        # ── Step 6b: download GLB ────────────────────────────────────────────
        await _progress(7, message="Downloading GLB")
        glb_bytes = await tripo_client.download_glb(glb_url)

    except OfflineModeError:
        logger.info("Offline mode: loading placeholder GLB for job %s", job_id)
        from app.services.glb_loader import load_glb
        placeholder_uri = f"local:{settings.LOCAL_GLB_DIR}/placeholder.glb"
        try:
            glb_bytes = await load_glb(placeholder_uri, cache=cache, s3=s3_service)
        except Exception:
            glb_bytes = b""  # Empty stub in offline mode

    except (TripoAPIError, TripoTaskFailed, ValueError) as exc:
        logger.exception("Generation failed for job %s", job_id)
        await update_job_status(
            job_id=job_id,
            status="FAILED",
            db=db,
            cache=cache,
            extra={"error": str(exc)},
        )
        return

    if not glb_bytes:
        await update_job_status(
            job_id=job_id,
            status="FAILED",
            db=db,
            cache=cache,
            extra={"error": "Empty GLB received"},
        )
        return

    # ── Step 7-8: cache + upload ─────────────────────────────────────────────
    await _progress(8, message="Caching result")
    if cache and result_cache_key:
        await cache.set_glb(result_cache_key, glb_bytes)

    await _finish_from_bytes(job_id, user_id, glb_bytes, db, cache, s3_service, settings)

    if redis_client:
        await redis_client.aclose()


async def _finish_from_bytes(job_id, user_id, glb_bytes, db, cache, s3_service, settings) -> None:
    from app.services.job_service import update_job_status
    from app.services.s3_service import S3Service

    # ── Step 9: upload result to S3 ──────────────────────────────────────────
    s3_key = s3_service.key_try_on_result(user_id, job_id)
    try:
        await s3_service.upload_bytes(glb_bytes, s3_key, "model/gltf-binary")
    except Exception as exc:
        logger.exception("S3 upload failed for job %s", job_id)
        await update_job_status(
            job_id=job_id,
            status="FAILED",
            db=db,
            cache=cache,
            extra={"error": f"Failed to upload result: {exc}"},
        )
        return

    # ── Step 10: mark COMPLETED ───────────────────────────────────────────────
    now = datetime.now(timezone.utc).isoformat()
    await update_job_status(
        job_id=job_id,
        status="COMPLETED",
        db=db,
        cache=cache,
        extra={
            "resultS3Key": s3_key,
            "completedAt": now,
            "progress": 100,
        },
    )
    logger.info("Job %s completed successfully → %s", job_id, s3_key)


# ---------------------------------------------------------------------------
# Celery task definition
# ---------------------------------------------------------------------------

@celery_app.task(
    bind=True,
    name="app.workers.try_on_task.run_try_on",
    max_retries=2,
    default_retry_delay=30,
    rate_limit="20/m",
    acks_late=True,
)
def run_try_on(self: Task, job_id: str, user_id: str) -> dict[str, Any]:
    """Celery entry-point — runs the async pipeline in a fresh event loop."""
    logger.info("Starting try-on task job_id=%s user_id=%s", job_id, user_id)
    try:
        asyncio.run(_run_pipeline(job_id, user_id))
        return {"status": "completed", "jobId": job_id}
    except Exception as exc:
        logger.exception("Unhandled exception in try-on task %s", job_id)
        raise self.retry(exc=exc) from exc
