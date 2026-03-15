"""Celery task for avatar generation."""

import asyncio
import logging

import httpx

from app.core.celery_app import celery_app
from app.core.db import prisma_session
from app.core.exceptions import (
    ExternalAPIError,
    JobNotFoundError,
    ModelInferenceError,
    StorageError,
)
from app.services.avatar_service import run_avatar_pipeline

logger = logging.getLogger(__name__)


def _is_job_not_found_exception(exc: Exception) -> bool:
    name = exc.__class__.__name__.lower()
    message = str(exc).lower()
    return "notfound" in name or ("record" in message and "not found" in message)


def _map_avatar_exception(exc: Exception) -> Exception:
    if isinstance(
        exc,
        (StorageError, ModelInferenceError, ExternalAPIError, JobNotFoundError),
    ):
        return exc

    storage_class_names = {"clienterror", "botocoreerror", "nocredentialserror"}
    if isinstance(exc, (FileNotFoundError, OSError)) or (
        exc.__class__.__name__.lower() in storage_class_names
    ):
        return StorageError(str(exc))

    if isinstance(exc, httpx.HTTPError):
        return ExternalAPIError(str(exc))

    if isinstance(exc, (MemoryError, TimeoutError, RuntimeError, ValueError)):
        return ModelInferenceError(str(exc))

    return ModelInferenceError(str(exc))


async def _set_job_status(
    job_id: str, status: str, result_url: str | None = None
) -> None:
    data: dict = {"status": status}
    if result_url is not None:
        data["resultUrl"] = result_url
    try:
        async with prisma_session() as db:
            await db.aijob.update(where={"id": job_id}, data=data)
    except Exception as exc:
        if _is_job_not_found_exception(exc):
            raise JobNotFoundError(f"Job not found: {job_id}") from exc
        raise


@celery_app.task(name="app.tasks.avatar.avatar_generation_task")
def avatar_generation_task(job_id: str, payload: dict) -> dict:
    """Process an AVATAR_GENERATION job.

    Updates ai_jobs status to PROCESSING, runs the pipeline, then marks
    the job COMPLETED with the resulting R2 URL.  On any exception the
    job is marked FAILED before the exception is re-raised.
    """
    try:
        logger.info("Avatar task started", extra={"job_id": job_id})
        asyncio.run(_set_job_status(job_id, "PROCESSING"))
        result_url = run_avatar_pipeline(
            job_id=job_id,
            user_id=payload["user_id"],
            front_url=payload["front_photo_url"],
            side_url=payload["side_photo_url"],
            back_url=payload["back_photo_url"],
        )
        asyncio.run(_set_job_status(job_id, "COMPLETED", result_url))
        logger.info("Avatar task completed", extra={"job_id": job_id})
        return {"status": "COMPLETED", "result_url": result_url}
    except Exception as exc:
        mapped_exc = _map_avatar_exception(exc)
        logger.exception(
            "Avatar task failed",
            extra={"job_id": job_id},
            exc_info=exc,
        )
        try:
            asyncio.run(_set_job_status(job_id, "FAILED"))
        except JobNotFoundError:
            logger.exception(
                "Failed to update avatar job status because job was not found",
                extra={"job_id": job_id},
            )
        raise mapped_exc from exc
