"""
workers.py — Avatar Generation Celery Task
------------------------------------------
Implements a 5-tier fallback cascade so avatar generation ALWAYS
returns something, even when GPU services are unavailable.

  Tier 0  Redis / S3 cache                 — free, <50ms
  Tier 1  Tripo multiview (3 photos)        — best quality, ~$0.01/call
  Tier 2  Tripo single-image (front only)   — good quality, ~$0.01/call
  Tier 3  SMPL-X local CPU (measurements)  — free, ~10s, body-accurate
  Tier 4  Pre-baked universal template     — free, instant, always works

Result: base avatar GLB stored at S3 key avatars/{userId}/base.glb
and cached in Redis under glb:avatar:{userId}.

Fixes applied:
  - import aioredis (bare, legacy package)
      → import redis.asyncio as aioredis
  - await s3.put_object(s3_key, glb_bytes, content_type=...)
      → await s3.upload_bytes(s3_key, glb_bytes, "model/gltf-binary")
        (StorageService exposes upload_bytes, not put_object)
"""
from __future__ import annotations

import asyncio
import json
import logging
from datetime import datetime, timezone
from typing import Any, Optional

from celery import Task

from app.infrastructure.queue.celery_app import celery_app

logger = logging.getLogger("worker.avatar")


# ---------------------------------------------------------------------------
# Async pipeline
# ---------------------------------------------------------------------------

async def _run_avatar_pipeline(job_id: str, user_id: str) -> None:
    from app.config.settings import settings
    from app.db.prisma_connect import db
    from app.infrastructure.cache.cache_service import CacheService
    from app.infrastructure.storage.storage_service import storage_service
    from app.modules.avatar.service import update_avatar_job

    # ── Bootstrap Redis cache ────────────────────────────────────────────────
    redis_client = None
    cache: Optional[CacheService] = None
    try:
        # Use redis.asyncio, not the legacy standalone aioredis package
        import redis.asyncio as aioredis
        redis_client = aioredis.from_url(settings.REDIS_URL, decode_responses=False)
        cache = CacheService(redis_client)
    except Exception as exc:
        logger.warning("Avatar worker: Redis unavailable — %s", exc)

    async def progress(step: int, label: str) -> None:
        pct = round(step / 10 * 100)
        await update_avatar_job(
            job_id, "PROCESSING", db=db, cache=cache,
            extra={"progress": pct, "step": label},
        )

    # ── Connect DB ───────────────────────────────────────────────────────────
    if not db.is_connected():
        await db.connect()

    # ── Step 1: Load job & parse input photos ────────────────────────────────
    await progress(1, "Loading job")
    job = await db.generationjob.find_first(
        where={"id": job_id, "userId": user_id}
    )
    if not job:
        logger.error("Avatar job %s not found for user %s", job_id, user_id)
        if redis_client:
            await redis_client.aclose()
        return

    try:
        photo_keys: dict = json.loads(job.inputS3Key or "{}")
    except (json.JSONDecodeError, TypeError):
        photo_keys = {}

    front_s3_key: Optional[str] = photo_keys.get("front")
    side_s3_key: Optional[str] = photo_keys.get("side")
    back_s3_key: Optional[str] = photo_keys.get("back")
    height_cm: Optional[float] = photo_keys.get("heightCm")

    if not front_s3_key:
        await update_avatar_job(
            job_id, "FAILED", db=db, cache=cache,
            extra={"error": "frontPhotoS3Key missing from job payload"},
        )
        if redis_client:
            await redis_client.aclose()
        return

    # ── Step 2: Load profile for SMPL-X fallback ────────────────────────────
    await progress(2, "Loading profile")
    profile = await db.userprofile.find_first(
        where={"userId": user_id, "deletedAt": None}
    )

    t_height: Optional[float] = getattr(profile, "tHeight", None) if profile else None
    t_fullness: Optional[float] = getattr(profile, "tFullness", None) if profile else None
    gender: str = getattr(profile, "gender", "neutral") if profile else "neutral"
    if gender not in ("male", "female", "neutral"):
        gender = "neutral"

    # If the request included a height, update the profile and derive tHeight
    if height_cm and profile:
        t_height_new = _height_cm_to_t(height_cm)
        try:
            await db.userprofile.update(
                where={"id": profile.id},
                data={"tHeight": t_height_new},
            )
            t_height = t_height_new
        except Exception as exc:
            logger.warning("Avatar worker: could not update height — %s", exc)

    # ── Step 3: Check result cache ───────────────────────────────────────────
    await progress(3, "Checking cache")
    avatar_s3_key = storage_service.key_base_avatar(user_id)
    redis_cache_key = cache.key_base_avatar(user_id) if cache else None

    if redis_cache_key and cache:
        cached_glb = await cache.get_glb(redis_cache_key)
        if cached_glb:
            logger.info("Avatar job %s: using cached GLB", job_id)
            await update_avatar_job(
                job_id, "COMPLETED", db=db, cache=cache,
                extra={
                    "progress": 100,
                    "step": "Done (cache hit)",
                    "provider": "cache",
                    "resultS3Key": avatar_s3_key,
                    "completedAt": datetime.now(timezone.utc).isoformat(),
                },
            )
            if redis_client:
                await redis_client.aclose()
            return

    # ── Step 4: Generate presigned URLs for Tripo ────────────────────────────
    await progress(4, "Preparing photo URLs")
    front_url: Optional[str] = None
    side_url: Optional[str] = None
    back_url: Optional[str] = None

    try:
        front_url = await storage_service.generate_presigned_url(front_s3_key, ttl=900)
        if side_s3_key:
            side_url = await storage_service.generate_presigned_url(side_s3_key, ttl=900)
        if back_s3_key:
            back_url = await storage_service.generate_presigned_url(back_s3_key, ttl=900)
    except Exception as exc:
        logger.error("Avatar: failed to generate presigned photo URLs — %s", exc)
        await update_avatar_job(
            job_id, "FAILED", db=db, cache=cache,
            extra={"error": f"Could not access uploaded photos: {exc}"},
        )
        if redis_client:
            await redis_client.aclose()
        return

    glb_bytes: Optional[bytes] = None
    provider: str = "unknown"

    # ── Tier 1: Tripo multiview (front + side + back) ────────────────────────
    await progress(5, "Generating avatar (Tripo multiview)")
    glb_bytes, provider = await _try_tripo_multiview(front_url, side_url, back_url)

    # ── Tier 2: Tripo single-image (front only) ──────────────────────────────
    if glb_bytes is None:
        await progress(6, "Generating avatar (Tripo single-image fallback)")
        glb_bytes, provider = await _try_tripo_single(front_url)

    # ── Tier 3: SMPL-X local CPU ─────────────────────────────────────────────
    if glb_bytes is None and t_height is not None and t_fullness is not None:
        await progress(7, "Generating avatar (SMPL-X local)")
        glb_bytes, provider = await _try_smplx(t_height, t_fullness, gender)

    # ── Tier 4: Pre-baked universal template ────────────────────────────────
    if glb_bytes is None:
        await progress(8, "Loading fallback template")
        glb_bytes, provider = await _try_template(user_id, t_height, t_fullness, db, cache)

    if glb_bytes is None:
        await update_avatar_job(
            job_id, "FAILED", db=db, cache=cache,
            extra={"error": "All avatar generation tiers failed"},
        )
        logger.error("Avatar job %s: ALL tiers failed", job_id)
        if redis_client:
            await redis_client.aclose()
        return

    # ── Steps 9-10: Store result & mark COMPLETED ─────────────────────────────
    await progress(9, "Storing avatar")
    await _finish(
        job_id=job_id,
        user_id=user_id,
        glb_bytes=glb_bytes,
        s3_key=avatar_s3_key,
        provider=provider,
        db=db,
        cache=cache,
        s3=storage_service,
    )

    if redis_client:
        await redis_client.aclose()


# ---------------------------------------------------------------------------
# Tier helpers
# ---------------------------------------------------------------------------

async def _try_tripo_multiview(
    front_url: str,
    side_url: Optional[str],
    back_url: Optional[str],
) -> tuple[Optional[bytes], str]:
    try:
        from app.modules.avatar.providers.tripo_avatar_provider import tripo_avatar_provider

        glb = await tripo_avatar_provider.generate_from_multiview(
            front_url, side_url, back_url
        )
        logger.info("Tier 1 (Tripo multiview) SUCCESS — %d bytes", len(glb))
        return glb, "tripo_multiview"
    except Exception as exc:
        logger.warning("Tier 1 (Tripo multiview) FAILED — %s", exc)
        return None, ""


async def _try_tripo_single(front_url: str) -> tuple[Optional[bytes], str]:
    try:
        from app.modules.avatar.providers.tripo_avatar_provider import tripo_avatar_provider

        glb = await tripo_avatar_provider.generate_from_single(front_url)
        logger.info("Tier 2 (Tripo single) SUCCESS — %d bytes", len(glb))
        return glb, "tripo_single"
    except Exception as exc:
        logger.warning("Tier 2 (Tripo single) FAILED — %s", exc)
        return None, ""


async def _try_smplx(
    t_height: float, t_fullness: float, gender: str
) -> tuple[Optional[bytes], str]:
    try:
        from app.modules.avatar.providers.smplx_provider import generate_smplx_avatar

        glb = await generate_smplx_avatar(t_height, t_fullness, gender)
        logger.info("Tier 3 (SMPL-X) SUCCESS — %d bytes", len(glb))
        return glb, "smplx_local"
    except Exception as exc:
        logger.warning("Tier 3 (SMPL-X) FAILED — %s", exc)
        return None, ""


async def _try_template(
    user_id: str,
    t_height: Optional[float],
    t_fullness: Optional[float],
    db: Any,
    cache: Optional[Any],
) -> tuple[Optional[bytes], str]:
    try:
        from app.modules.prebake.service import get_template_glb

        glb = await get_template_glb(user_id, t_height, t_fullness, db, cache)
        logger.info("Tier 4 (Template) SUCCESS — %d bytes", len(glb))
        return glb, "template_fallback"
    except Exception as exc:
        logger.warning("Tier 4 (Template) FAILED — %s", exc)
        return None, ""


# ---------------------------------------------------------------------------
# Shared finish helper
# ---------------------------------------------------------------------------

async def _finish(
    job_id: str,
    user_id: str,
    glb_bytes: bytes,
    s3_key: str,
    provider: str,
    db: Any,
    cache: Optional[Any],
    s3: Any,
) -> None:
    from app.modules.avatar.service import update_avatar_job

    # upload_bytes(object_key, data, content_type) — object_key is the first arg.
    # StorageService does NOT have a put_object() method.
    try:
        await s3.upload_bytes(s3_key, glb_bytes, "model/gltf-binary")
    except Exception as exc:
        logger.exception("Avatar: Failed to upload GLB to S3 — %s", exc)
        await update_avatar_job(
            job_id, "FAILED", db=db, cache=cache,
            extra={"error": f"Upload to S3 failed: {exc}"},
        )
        return

    # Warm Redis cache so subsequent reads are instant
    if cache:
        await cache.set_glb(cache.key_base_avatar(user_id), glb_bytes)

    now = datetime.now(timezone.utc).isoformat()
    await update_avatar_job(
        job_id, "COMPLETED", db=db, cache=cache,
        extra={
            "progress": 100,
            "step": "Done",
            "provider": provider,
            "resultS3Key": s3_key,
            "completedAt": now,
        },
    )
    logger.info(
        "Avatar job %s COMPLETED via %s → s3://%s",
        job_id, provider, s3_key,
    )


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _height_cm_to_t(height_cm: float) -> float:
    """Normalise height_cm to [0, 1] using a 140–210 cm range."""
    MIN_H, MAX_H = 140.0, 210.0
    return max(0.0, min(1.0, (height_cm - MIN_H) / (MAX_H - MIN_H)))


# ---------------------------------------------------------------------------
# Celery task
# ---------------------------------------------------------------------------

@celery_app.task(
    bind=True,
    name="app.modules.avatar.workers.generate_avatar",
    max_retries=2,
    default_retry_delay=30,
    rate_limit="10/m",
    acks_late=True,
)
def generate_avatar(self: Task, job_id: str, user_id: str) -> dict[str, Any]:
    """Celery task wrapper for the avatar generation pipeline."""
    logger.info(
        "Starting avatar generation task job_id=%s user_id=%s", job_id, user_id
    )
    try:
        asyncio.run(_run_avatar_pipeline(job_id, user_id))
        return {"status": "success", "job_id": job_id}
    except Exception as exc:
        logger.exception(
            "Avatar generation task failed: job_id=%s user_id=%s", job_id, user_id
        )
        if self.request.retries < self.max_retries:
            raise self.retry(exc=exc)
        return {"status": "failed", "job_id": job_id, "error": str(exc)}