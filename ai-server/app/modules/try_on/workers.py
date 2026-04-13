"""
workers.py — Try-On Celery Task (router version)
-------------------------------------------------
Replaces the original single-provider pipeline with the GenerationRouter
cascade. The 10-step structure is preserved; Steps 5-7 are handled by
the router internally.

Steps:
  1. Validate job & load profile
  2. Classify body type from measurements
  3. Build router kwargs from job + profile
  4. Check result cache (router Tier 0)
  5. Run GenerationRouter cascade (Tiers 1-4)
  6. Store result in S3
  7. Update job COMPLETED

Fixes applied:
  - app.core.config          → app.config.settings
  - app.db.queries.jobs      → app.infrastructure.db.repositories.generation_job_repo
  - app.db.queries.profile   → app.infrastructure.db.repositories.user_profile_repo
  - app.infrastructure.storage.s3 → app.infrastructure.storage.storage_service
  - app.services.job_service → app.modules.try_on.service
  - app.worker.celery_app    → app.infrastructure.queue.celery_app
  - key_try_on_result(user_id, job_id) → key_try_on_result(job_id)  (1-arg signature)
  - upload_bytes(glb_bytes, s3_key, ...) → upload_bytes(s3_key, glb_bytes, ...)
"""
from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timezone
from typing import Any, Optional

from celery import Task

from app.infrastructure.queue.celery_app import celery_app

logger = logging.getLogger("worker.try_on")


async def _run_pipeline(job_id: str, user_id: str) -> None:
    # ── All imports are deferred so this coroutine can be safely imported
    # ── in environments where some optional deps are not installed.
    from app.config.settings import settings
    from app.db.prisma_connect import db
    from app.infrastructure.cache.cache_service import CacheService
    from app.infrastructure.db.repositories.generation_job_repo import get_job_by_id
    from app.infrastructure.db.repositories.user_profile_repo import get_profile
    from app.infrastructure.storage.storage_service import storage_service
    from app.modules.try_on.generation_router import GenerationRouter
    from app.modules.try_on.service import update_job_status

    redis_client = None
    cache: Optional[CacheService] = None

    try:
        import redis.asyncio as aioredis
        redis_client = aioredis.from_url(settings.REDIS_URL, decode_responses=False)
        cache = CacheService(redis_client)
    except Exception as exc:
        logger.warning("Redis unavailable in worker: %s", exc)

    async def _progress(step: int, message: str = "") -> None:
        await update_job_status(
            job_id=job_id,
            status="PROCESSING",
            db=db,
            cache=cache,
            extra={"progress": round(step / 10 * 100), "step": message},
        )

    # ── Step 1: load & validate job ──────────────────────────────────────────
    await _progress(1, "Loading job")
    if not db.is_connected():
        await db.connect()

    job = await get_job_by_id(job_id, user_id, db)
    if not job:
        logger.error("Job %s not found for user %s", job_id, user_id)
        if redis_client:
            await redis_client.aclose()
        return

    # ── Step 2: load profile ─────────────────────────────────────────────────
    await _progress(2, "Loading profile")
    profile = await get_profile(user_id, db)

    t_height: Optional[float] = getattr(profile, "tHeight", None) if profile else None
    t_fullness: Optional[float] = getattr(profile, "tFullness", None) if profile else None
    ethnicity: Optional[str] = getattr(profile, "ethnicity", None) if profile else None
    consent: bool = getattr(profile, "consentGiven", False) if profile else False
    gender: str = getattr(profile, "gender", "neutral") if profile else "neutral"
    if gender not in ("male", "female", "neutral"):
        gender = "neutral"

    image_s3_key: Optional[str] = (
        getattr(job, "userImageS3Key", None) or getattr(job, "inputS3Key", None)
    )
    category: str = getattr(job, "category", "CASUAL") or "CASUAL"

    # ── Step 3: build router ─────────────────────────────────────────────────
    await _progress(3, "Selecting generation strategy")
    router = GenerationRouter(db=db, cache=cache, s3=storage_service)

    # ── Steps 4-7: run cascade ───────────────────────────────────────────────
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
            job_id=job_id,
            status="FAILED",
            db=db,
            cache=cache,
            extra={"error": str(exc)},
        )
        if redis_client:
            await redis_client.aclose()
        return

    logger.info(
        "Generation complete job=%s provider=%s used_fallback=%s bytes=%d",
        job_id,
        result.provider,
        result.used_fallback,
        len(result.glb_bytes),
    )

    # ── Step 8: upload result to S3 ──────────────────────────────────────────
    await _progress(8, "Uploading result")

    # key_try_on_result takes only job_id (1 arg)
    s3_key = storage_service.key_try_on_result(job_id)
    try:
        # upload_bytes(object_key, data, content_type) — correct arg order
        await storage_service.upload_bytes(s3_key, result.glb_bytes, "model/gltf-binary")
    except Exception as exc:
        logger.exception("S3 upload failed for job %s", job_id)
        await update_job_status(
            job_id=job_id,
            status="FAILED",
            db=db,
            cache=cache,
            extra={"error": f"S3 upload failed: {exc}"},
        )
        if redis_client:
            await redis_client.aclose()
        return

    # ── Steps 9-10: mark COMPLETED ───────────────────────────────────────────
    await _progress(9, "Finalising")
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
            "provider": result.provider,
            "usedFallback": result.used_fallback,
        },
    )
    logger.info("Job %s COMPLETED → %s (via %s)", job_id, s3_key, result.provider)

    if redis_client:
        await redis_client.aclose()


@celery_app.task(
    bind=True,
    name="app.modules.try_on.workers.run_try_on",
    max_retries=2,
    default_retry_delay=30,
    rate_limit="20/m",
    acks_late=True,
)
def run_try_on(self: Task, job_id: str, user_id: str) -> dict[str, Any]:
    """Celery entry-point for the try-on generation pipeline."""
    logger.info("Starting try-on task job_id=%s user_id=%s", job_id, user_id)
    try:
        asyncio.run(_run_pipeline(job_id, user_id))
        return {"status": "completed", "jobId": job_id}
    except Exception as exc:
        logger.exception("Unhandled exception in try-on task %s", job_id)
        raise self.retry(exc=exc) from exc