"""Celery task for the TRY_ON_SCENE pipeline.

vton_task is the primary entry point:
  - Updates ai_jobs status to PROCESSING
  - Calls run_vton_pipeline (render -> OOTD -> background -> composite -> R2)
  - Updates ai_jobs status to COMPLETED with the result URL
  - On any exception: updates ai_jobs to FAILED and re-raises

The legacy try_on_scene task is kept for backward compatibility with the
/jobs router which routes "try_on_scene" to app.tasks.vton.try_on_scene.
"""

from __future__ import annotations

import asyncio
import logging
from typing import Any

import httpx

from app.core.celery_app import celery_app
from app.core.db import prisma_session
from app.core.exceptions import (
    ExternalAPIError,
    JobNotFoundError,
    ModelInferenceError,
    StorageError,
)
from app.services.vton_service import run_vton_pipeline

logger = logging.getLogger(__name__)


def _is_job_not_found_exception(exc: Exception) -> bool:
    name = exc.__class__.__name__.lower()
    message = str(exc).lower()
    return "notfound" in name or ("record" in message and "not found" in message)


def _map_vton_exception(exc: Exception) -> Exception:
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


# ── DB helpers ────────────────────────────────────────────────────────────────


async def _set_job_status(
    job_id: str,
    status: str,
    result_url: str | None = None,
) -> None:
    """Update the ai_jobs record status (and optionally resultUrl)."""
    data: dict[str, Any] = {"status": status}
    if result_url is not None:
        data["resultUrl"] = result_url
    try:
        async with prisma_session() as db:
            await db.aijob.update(where={"id": job_id}, data=data)
    except Exception as exc:
        if _is_job_not_found_exception(exc):
            raise JobNotFoundError(f"Job not found: {job_id}") from exc
        raise


# ── Primary Celery task ───────────────────────────────────────────────────────


@celery_app.task(name="app.tasks.vton.vton_task")
def vton_task(job_id: str, payload: dict) -> dict:
    """Process a TRY_ON_SCENE job.

    Parameters
    ----------
    job_id:
        The ``ai_jobs.id`` (UUID string) for this task.
    payload:
        Must contain: user_id, avatar_glb_url, dress_image_url.
        Optional:     scene_prompt (defaults to empty string).
    """
    try:
        logger.info("VTON task started", extra={"job_id": job_id})
        asyncio.run(_set_job_status(job_id, "PROCESSING"))
        result_url = run_vton_pipeline(
            job_id=job_id,
            user_id=payload["user_id"],
            avatar_glb_url=payload["avatar_glb_url"],
            dress_image_url=payload["dress_image_url"],
            scene_prompt=payload.get("scene_prompt", ""),
        )
        asyncio.run(_set_job_status(job_id, "COMPLETED", result_url))
        logger.info("VTON task completed", extra={"job_id": job_id})
        return {"status": "COMPLETED", "result_url": result_url}
    except Exception as exc:
        mapped_exc = _map_vton_exception(exc)
        logger.exception(
            "TRY_ON_SCENE task failed",
            extra={"job_id": job_id},
            exc_info=exc,
        )
        try:
            asyncio.run(_set_job_status(job_id, "FAILED"))
        except JobNotFoundError:
            logger.exception(
                "Failed to update VTON job status because job was not found",
                extra={"job_id": job_id},
            )
        raise mapped_exc from exc


# ── Legacy entry point ────────────────────────────────────────────────────────


@celery_app.task(name="app.tasks.vton.try_on_scene")
def try_on_scene(payload: dict) -> dict:
    """Legacy task name — delegates to vton_task without DB tracking.

    The /jobs router sends tasks to this name.  It runs the VTON pipeline
    directly without updating ai_jobs (no job_id is available at this call
    site).  Use vton_task for full ai_jobs lifecycle management.
    """
    from app.models.job_schemas import TryOnScenePayload

    parsed = TryOnScenePayload(**payload)
    job_id = payload.get("job_id", "legacy")
    try:
        logger.info("Legacy try_on_scene task started", extra={"job_id": job_id})
        result_url = run_vton_pipeline(
            job_id=job_id,
            user_id=parsed.user_id,
            avatar_glb_url=parsed.avatar_glb_url,
            dress_image_url=parsed.dress_image_url,
            scene_prompt=payload.get("scene_prompt", ""),
        )
        logger.info("Legacy try_on_scene task completed", extra={"job_id": job_id})
        return {"status": "COMPLETED", "result_url": result_url}
    except Exception as exc:
        mapped_exc = _map_vton_exception(exc)
        logger.exception(
            "try_on_scene legacy task failed",
            extra={"job_id": job_id},
            exc_info=exc,
        )
        raise mapped_exc from exc
