"""
try_on_service.py — GenerationJob Lifecycle Management
------------------------------------------------------
Creates, updates, and provides job progress for GenerationJob records.

DB updates are fire-and-forget (background) to avoid blocking the pipeline.
Redis updates are synchronous so polling clients always see fresh data.
"""

from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timezone
from typing import TYPE_CHECKING, Optional

if TYPE_CHECKING:
    from prisma import Prisma
    from app.infrastructure.cache.cache_service import CacheService

logger = logging.getLogger("api.try_on")


async def create_job(
    user_id: str,
    db: "Prisma",
    template_dress_id: Optional[str] = None,
    user_image_s3_key: Optional[str] = None,
    cache: Optional["CacheService"] = None,
) -> object:
    """Create a new GenerationJob record with PENDING status. Returns the job object."""
    job = await db.generationjob.create(
        data={
            "userId": user_id,
            "jobType": "TRYON_GENERATION",
            "status": "PENDING",
            "progress": 0,
            "templateDressId": template_dress_id,
            "userImageS3Key": user_image_s3_key,
        }
    )

    # Seed Redis cache for fast polling
    if cache:
        await cache.set_job_status(
            job.id,
            {
                "id": job.id,
                "status": "PENDING",
                "progress": 0,
                "resultS3Key": None,
                "error": None,
                "createdAt": job.createdAt.isoformat()
                if hasattr(job.createdAt, "isoformat")
                else str(job.createdAt),
                "completedAt": None,
            },
        )

    return job


async def update_job_status(
    job_id: str,
    status: str,
    db: "Prisma",
    cache: Optional["CacheService"] = None,
    extra: Optional[dict] = None,
) -> None:
    """
    Update job progress in both Redis (sync) and DB (async background).
    Redis update is done first so polling clients always see fresh data.

    *extra* can contain any of: progress, currentStage, errorMessage,
    resultS3Key, completedAt, tripoTaskId.
    """
    extra = extra or {}

    payload: dict = {
        "id": job_id,
        "status": status,
        "progress": extra.get("progress", 0),
        "currentStage": extra.get("step"),
        "errorMessage": extra.get("error"),
        "resultS3Key": extra.get("resultS3Key"),
        "completedAt": extra.get("completedAt"),
    }

    # Sync Redis update
    if cache:
        await cache.set_job_status(job_id, payload)

    # Async DB update (fire-and-forget)
    now = datetime.now(timezone.utc)
    db_data: dict = {
        "status": status,
        "progress": extra.get("progress", 0),
        "currentStage": extra.get("step"),
        "errorMessage": extra.get("error"),
    }
    if status == "COMPLETED":
        db_data["completedAt"] = now
    if extra.get("resultS3Key"):
        db_data["outputGlbS3Key"] = extra["resultS3Key"]
    if extra.get("tripoTaskId"):
        db_data["tripoTaskId"] = extra["tripoTaskId"]

    async def _update_db() -> None:
        try:
            await db.generationjob.update(where={"id": job_id}, data=db_data)
        except Exception as exc:
            logger.error("job_service: DB update failed for job=%s: %s", job_id, exc)

    asyncio.ensure_future(_update_db())


async def get_job(
    job_id: str,
    user_id: str,
    db: "Prisma",
    cache: Optional["CacheService"] = None,
) -> Optional[dict]:
    """
    Return job status dict. Reads Redis first, falls back to DB.
    Returns None if job not found or belongs to a different user.
    """
    # Try Redis first
    if cache:
        cached = await cache.get_job_status(job_id)
        if cached:
            # Validate ownership via DB (Redis doesn't store userId)
            job = await db.generationjob.find_first(
                where={"id": job_id, "userId": user_id}
            )
            if not job:
                return None
            return cached

    # DB fallback
    job = await db.generationjob.find_first(where={"id": job_id, "userId": user_id})
    if not job:
        return None

    return {
        "id": job.id,
        "status": job.status,
        "progress": job.progress,
        "currentStage": getattr(job, "currentStage", None),
        "errorMessage": getattr(job, "errorMessage", None),
        "resultS3Key": getattr(job, "outputGlbS3Key", None),
        "error": getattr(job, "errorMessage", None),
        "createdAt": job.createdAt.isoformat()
        if hasattr(job.createdAt, "isoformat")
        else str(job.createdAt),
        "completedAt": getattr(job, "completedAt", None),
    }
