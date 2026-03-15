"""
job_service.py — GenerationJob Lifecycle Management
-----------------------------------------------------
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
    from app.services.cache import CacheService

logger = logging.getLogger("api_security")


async def create_job(
    user_id: str,
    job_type: str,
    db: "Prisma",
    input_s3_key: Optional[str] = None,
) -> str:
    """Create a new GenerationJob record with PENDING status. Returns job_id."""
    job = await db.generationjob.create(
        data={
            "userId": user_id,
            "jobType": job_type,
            "status": "PENDING",
            "progress": 0,
            "inputS3Key": input_s3_key,
        }
    )
    return job.id


async def update_job_status(
    job_id: str,
    status: str,
    progress: int,
    stage: str,
    db: "Prisma",
    cache: "CacheService",
    error_message: Optional[str] = None,
    output_glb_s3_key: Optional[str] = None,
    tripo_task_id: Optional[str] = None,
) -> None:
    """
    Update job progress in both Redis (sync) and DB (async background).
    Redis update is done first so polling clients always see fresh data.
    """
    payload: dict = {
        "jobId": job_id,
        "status": status,
        "progress": progress,
        "currentStage": stage,
        "errorMessage": error_message,
    }

    # Sync Redis update
    await cache.set_job_status(job_id, payload)

    # Async DB update (fire-and-forget)
    now = datetime.now(timezone.utc)
    db_data: dict = {
        "status": status,
        "progress": progress,
        "currentStage": stage,
        "errorMessage": error_message,
    }
    if status == "COMPLETED":
        db_data["completedAt"] = now
    if output_glb_s3_key:
        db_data["outputGlbS3Key"] = output_glb_s3_key
    if tripo_task_id:
        db_data["tripoTaskId"] = tripo_task_id

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
    cache: "CacheService",
) -> Optional[dict]:
    """
    Return job status dict. Reads Redis first, falls back to DB.
    Returns None if job not found or belongs to a different user.
    """
    # Try Redis first
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
    job = await db.generationjob.find_first(
        where={"id": job_id, "userId": user_id}
    )
    if not job:
        return None

    return {
        "jobId": job.id,
        "status": job.status,
        "progress": job.progress,
        "currentStage": job.currentStage,
        "errorMessage": job.errorMessage,
    }
