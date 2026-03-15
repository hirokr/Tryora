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

from app.core.celery_app import celery_app
from app.core.db import prisma_session
from app.services.vton_service import run_vton_pipeline

logger = logging.getLogger(__name__)


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
    async with prisma_session() as db:
        await db.aijob.update(where={"id": job_id}, data=data)


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
    asyncio.run(_set_job_status(job_id, "PROCESSING"))

    try:
        result_url = run_vton_pipeline(
            job_id=job_id,
            user_id=payload["user_id"],
            avatar_glb_url=payload["avatar_glb_url"],
            dress_image_url=payload["dress_image_url"],
            scene_prompt=payload.get("scene_prompt", ""),
        )
        asyncio.run(_set_job_status(job_id, "COMPLETED", result_url))
        return {"status": "COMPLETED", "result_url": result_url}
    except Exception:
        logger.exception("[%s] TRY_ON_SCENE task FAILED", job_id)
        asyncio.run(_set_job_status(job_id, "FAILED"))
        raise


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
    try:
        result_url = run_vton_pipeline(
            job_id="legacy",
            user_id=parsed.user_id,
            avatar_glb_url=parsed.avatar_glb_url,
            dress_image_url=parsed.dress_image_url,
            scene_prompt=payload.get("scene_prompt", ""),
        )
        return {"status": "COMPLETED", "result_url": result_url}
    except Exception:
        logger.exception("try_on_scene legacy task FAILED")
        raise
