"""
workers.py — Try-On Celery Task (router version)
-------------------------------------------------
Replaces the original single-provider pipeline with the GenerationRouter
cascade. The 10-step structure is preserved; Steps 5-7 are now handled
by the router internally.

Steps:
  1. Validate job & load profile
  2. Classify body type from measurements
  3. Build router kwargs from job + profile
  4. Check result cache (router Tier 0)
  5. Run GenerationRouter cascade (Tiers 1-4)
  6. Store result in S3
  7. Update job COMPLETED
"""
from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timezone
from typing import Any

from celery import Task

from app.worker.celery_app import celery_app

logger = logging.getLogger("worker.try_on")


async def _run_pipeline(job_id: str, user_id: str) -> None:
    from app.core.config import settings
    from app.db.prisma_connect import db
    from app.db.queries.jobs import get_job_by_id
    from app.db.queries.profile import get_profile
    from app.infrastructure.cache.cache_service import CacheService
    from app.infrastructure.storage.s3 import s3_service
    from app.modules.try_on.generation_router import GenerationRouter
    from app.services.job_service import update_job_status

    redis_client = None
    cache = None

    try:
        import redis.asyncio as aioredis
        redis_client = aioredis.from_url(settings.REDIS_URL, decode_responses=False)
        cache = CacheService(redis_client)
    except Exception as exc:
        logger.warning("Redis unavailable in worker: %s", exc)

    async def _progress(step: int, message: str = "") -> None:
        if cache:
            await update_job_status(
                job_id=job_id, status="PROCESSING", db=db, cache=cache,
                extra={"progress": round(step / 10 * 100), "step": message},
            )

    # Step 1 — load & validate job
    await _progress(1, "Loading job")
    if not db.is_connected():
        await db.connect()

    job = await get_job_by_id(job_id, user_id, db)
    if not job:
        logger.error("Job %s not found for user %s", job_id, user_id)
        return

    # Step 2 — load profile
    await _progress(2, "Loading profile")
    profile = await get_profile(user_id, db)

    t_height   = getattr(profile, "tHeight",   None) if profile else None
    t_fullness = getattr(profile, "tFullness", None) if profile else None
    ethnicity  = getattr(profile, "ethnicity", None) if profile else None
    consent    = getattr(profile, "consentGiven", False) if profile else False
    gender     = getattr(profile, "gender", "neutral") if profile else "neutral"
    if gender not in ("male", "female", "neutral"):
        gender = "neutral"

    image_s3_key = getattr(job, "userImageS3Key", None) or getattr(job, "inputS3Key", None)
    category     = getattr(job, "category", "CASUAL") or "CASUAL"

    # Step 3 — build router
    await _progress(3, "Selecting generation strategy")
    router = GenerationRouter(db=db, cache=cache, s3=s3_service)

    # Steps 4-7 — run cascade
    await _progress(4, "Checking cache")

    try:
        result = await router.generate(
            job_id=job_id,
            user_id=user_id,
            t_height=t_height,
            t_fullness=t_fullness,
            image_s3_key=image_s3_key,
            category=category,
            ethnicity=ethnicity,
            consent_given=consent,
            gender=gender,
        )
    except RuntimeError as exc:
        logger.exception("All generation tiers failed for job %s", job_id)
        await update_job_status(
            job_id=job_id, status="FAILED", db=db, cache=cache,
            extra={"error": str(exc)},
        )
        return

    logger.info(
        "Generation complete job=%s provider=%s used_fallback=%s bytes=%d",
        job_id, result.provider, result.used_fallback, len(result.glb_bytes),
    )

    # Step 8 — upload result to S3
    await _progress(8, "Uploading result")
    s3_key = s3_service.key_try_on_result(user_id, job_id)
    try:
        await s3_service.upload_bytes(result.glb_bytes, s3_key, "model/gltf-binary")
    except Exception as exc:
        logger.exception("S3 upload failed for job %s", job_id)
        await update_job_status(
            job_id=job_id, status="FAILED", db=db, cache=cache,
            extra={"error": f"S3 upload failed: {exc}"},
        )
        return

    # Step 9-10 — mark COMPLETED
    await _progress(9, "Finalising")
    now = datetime.now(timezone.utc).isoformat()
    await update_job_status(
        job_id=job_id, status="COMPLETED", db=db, cache=cache,
        extra={
            "resultS3Key": s3_key,
            "completedAt": now,
            "progress": 100,
            "provider": result.provider,        # expose which tier won
            "usedFallback": result.used_fallback,
        },
    )
    logger.info("Job %s COMPLETED → %s (via %s)", job_id, s3_key, result.provider)

    if redis_client:
        await redis_client.aclose()


@celery_app.task(
    bind=True,
    name="app.workers.try_on_task.run_try_on",
    max_retries=2,
    default_retry_delay=30,
    rate_limit="20/m",
    acks_late=True,
)
def run_try_on(self: Task, job_id: str, user_id: str) -> dict[str, Any]:
    logger.info("Starting try-on task job_id=%s user_id=%s", job_id, user_id)
    try:
        asyncio.run(_run_pipeline(job_id, user_id))
        return {"status": "completed", "jobId": job_id}
    except Exception as exc:
        logger.exception("Unhandled exception in try-on task %s", job_id)
        raise self.retry(exc=exc) from exc
