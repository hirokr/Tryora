"""
service.py — Avatar GenerationJob Lifecycle
-------------------------------------------
Creates and queries avatar jobs in Postgres + Redis.
Mirrors the pattern used in app/modules/try_on/service.py.
"""
from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timezone
from typing import TYPE_CHECKING, Optional

if TYPE_CHECKING:
    from prisma import Prisma
    from app.infrastructure.cache.cache_service import CacheService

logger = logging.getLogger("api.avatar")

_JOB_TYPE = "AVATAR_GENERATION"


async def create_avatar_job(
    user_id: str,
    db: "Prisma",
    front_s3_key: str,
    side_s3_key: Optional[str] = None,
    back_s3_key: Optional[str] = None,
    height_cm: Optional[float] = None,
    cache: Optional["CacheService"] = None,
) -> object:
    """
    Persist a new PENDING avatar GenerationJob and seed Redis cache.
    Returns the created job object.
    """
    # Store all input keys in inputS3Key as JSON so the worker can retrieve them
    import json
    input_payload = json.dumps({
        "front": front_s3_key,
        "side": side_s3_key,
        "back": back_s3_key,
        "heightCm": height_cm,
    })

    job = await db.generationjob.create(
        data={
            "userId": user_id,
            "jobType": _JOB_TYPE,
            "status": "PENDING",
            "progress": 0,
            "inputS3Key": input_payload,   # repurposed to store all 3 keys as JSON
        }
    )

    if cache:
        await cache.set_job_status(
            job.id,
            {
                "id": job.id,
                "status": "PENDING",
                "progress": 0,
                "currentStage": None,
                "provider": None,
                "errorMessage": None,
                "resultS3Key": None,
                "createdAt": job.createdAt.isoformat()
                if hasattr(job.createdAt, "isoformat")
                else str(job.createdAt),
                "completedAt": None,
            },
        )

    logger.info("Avatar job created: job_id=%s user_id=%s", job.id, user_id)
    return job


async def update_avatar_job(
    job_id: str,
    status: str,
    db: "Prisma",
    cache: Optional["CacheService"] = None,
    extra: Optional[dict] = None,
) -> None:
    """
    Update job progress in Redis (sync) and Postgres (fire-and-forget).
    *extra* keys: progress, step, error, resultS3Key, completedAt, provider.
    """
    extra = extra or {}

    payload = {
        "id": job_id,
        "status": status,
        "progress": extra.get("progress", 0),
        "currentStage": extra.get("step"),
        "provider": extra.get("provider"),
        "errorMessage": extra.get("error"),
        "resultS3Key": extra.get("resultS3Key"),
        "completedAt": extra.get("completedAt"),
    }

    if cache:
        await cache.set_job_status(job_id, payload)

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

    async def _write_db() -> None:
        try:
            await db.generationjob.update(where={"id": job_id}, data=db_data)
        except Exception as exc:
            logger.error("avatar_service: DB update failed job=%s: %s", job_id, exc)

    asyncio.ensure_future(_write_db())


async def get_avatar_job(
    job_id: str,
    user_id: str,
    db: "Prisma",
    cache: Optional["CacheService"] = None,
) -> Optional[dict]:
    """
    Return job status dict (Redis-first, DB fallback).
    Returns None if not found or owned by a different user.
    """
    if cache:
        cached = await cache.get_job_status(job_id)
        if cached:
            # Verify ownership without exposing info to wrong user
            owns = await db.generationjob.find_first(
                where={"id": job_id, "userId": user_id, "jobType": _JOB_TYPE}
            )
            return cached if owns else None

    job = await db.generationjob.find_first(
        where={"id": job_id, "userId": user_id, "jobType": _JOB_TYPE}
    )
    if not job:
        return None

    return {
        "id": job.id,
        "status": job.status,
        "progress": job.progress,
        "currentStage": getattr(job, "currentStage", None),
        "provider": None,
        "errorMessage": getattr(job, "errorMessage", None),
        "resultS3Key": getattr(job, "outputGlbS3Key", None),
        "createdAt": job.createdAt.isoformat()
        if hasattr(job.createdAt, "isoformat")
        else str(job.createdAt),
        "completedAt": getattr(job, "completedAt", None),
    }
