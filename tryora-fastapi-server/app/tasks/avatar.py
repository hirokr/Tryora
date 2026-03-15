"""Celery task for avatar generation."""

import asyncio
import logging

from app.core.celery_app import celery_app
from app.core.db import prisma_session
from app.services.avatar_service import run_avatar_pipeline

logger = logging.getLogger(__name__)


async def _set_job_status(
    job_id: str, status: str, result_url: str | None = None
) -> None:
    data: dict = {"status": status}
    if result_url is not None:
        data["resultUrl"] = result_url
    async with prisma_session() as db:
        await db.aijob.update(where={"id": job_id}, data=data)


@celery_app.task(name="app.tasks.avatar.avatar_generation_task")
def avatar_generation_task(job_id: str, payload: dict) -> dict:
    """Process an AVATAR_GENERATION job.

    Updates ai_jobs status to PROCESSING, runs the pipeline, then marks
    the job COMPLETED with the resulting R2 URL.  On any exception the
    job is marked FAILED before the exception is re-raised.
    """
    asyncio.run(_set_job_status(job_id, "PROCESSING"))

    try:
        result_url = run_avatar_pipeline(
            job_id=job_id,
            user_id=payload["user_id"],
            front_url=payload["front_photo_url"],
            side_url=payload["side_photo_url"],
            back_url=payload["back_photo_url"],
        )
        asyncio.run(_set_job_status(job_id, "COMPLETED", result_url))
        return {"status": "COMPLETED", "result_url": result_url}
    except Exception:
        asyncio.run(_set_job_status(job_id, "FAILED"))
        raise
