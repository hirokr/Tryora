"""
try_on.py — /api/3d/try-on and /api/3d/jobs/* routes
------------------------------------------------------
POST   /api/3d/try-on             — enqueue a try-on job
GET    /api/3d/jobs               — list user's jobs
GET    /api/3d/jobs/{jobId}       — poll job status
GET    /api/3d/jobs/{jobId}/result — 302 → presigned S3 URL for finished GLB
"""

from __future__ import annotations

import logging
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import RedirectResponse

from app.api.deps import get_db
from app.config.settings import settings
from app.db.queries.jobs import get_job_by_id, list_user_jobs
from app.middleware.auth import TokenPayload, get_current_user
from app.modules.try_on.schemas import (
    JobStatusResponse,
    TryOnJobResponse,
    TryOnRequest,
)
from app.modules.try_on.service import create_job, get_job
from app.services.s3_service import s3_service

logger = logging.getLogger("api.try_on")

router = APIRouter(tags=["3D Try-On"])

_PRESIGNED_TTL = 900  # 15 minutes


def _get_cache(request: Request):
    cache = getattr(request.app.state, "cache", None)
    if cache is None:
        raise HTTPException(status_code=503, detail="Cache service unavailable")
    return cache


# ── POST /api/3d/try-on -------------------------------------------------------


@router.post(
    "/3d/try-on",
    response_model=TryOnJobResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Enqueue a 3-D try-on job",
)
async def submit_try_on(
    body: TryOnRequest,
    request: Request,
    current_user: Annotated[TokenPayload, Depends(get_current_user)],
    db=Depends(get_db),
) -> TryOnJobResponse:
    cache = _get_cache(request)

    # Rate-limit check: per-user Tripo quota
    user_limit = settings.MAX_TRIPO_CALLS_PER_USER
    window = settings.TRIPO_RATE_WINDOW_SECONDS
    allowed, count = await cache.check_and_increment_rate(
        current_user.user_id, user_limit, window
    )
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded: {user_limit} try-on calls per {window}s.",
        )

    # Global quota guard
    global_limit = settings.MAX_TRIPO_CALLS_GLOBAL
    g_allowed, _ = await cache.check_and_increment_global_rate(global_limit, window)
    if not g_allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Service is temporarily at capacity. Please try again shortly.",
        )

    # Persist a PENDING job record
    try:
        job = await create_job(
            user_id=current_user.user_id,
            db=db,
            template_dress_id=body.templateDressId,
            user_image_s3_key=body.userImageS3Key,
            cache=cache,
        )
    except Exception as exc:
        logger.exception("Failed to create job for user %s", current_user.user_id)
        raise HTTPException(status_code=500, detail="Failed to create job") from exc

    # Enqueue Celery task
    try:
        from app.modules.try_on.workers import run_try_on

        run_try_on.delay(job.id, current_user.user_id)
    except Exception as exc:
        logger.exception("Failed to enqueue task for job %s", job.id)
        logger.warning(
            "Task queue unavailable; job %s will not progress until queue recovers",
            job.id,
        )

    created_at = (
        job.createdAt.isoformat()
        if hasattr(job.createdAt, "isoformat")
        else str(job.createdAt)
    )
    return TryOnJobResponse(
        jobId=job.id,
        status=job.status,
        createdAt=created_at,
    )


# ── GET /api/3d/jobs ----------------------------------------------------------


@router.get(
    "/3d/jobs",
    summary="List all jobs for the authenticated user",
)
async def get_user_jobs(
    request: Request,
    current_user: Annotated[TokenPayload, Depends(get_current_user)],
    db=Depends(get_db),
    page: int = 1,
    page_size: int = 20,
):
    if page < 1:
        page = 1
    if not (1 <= page_size <= 100):
        page_size = 20

    jobs = await list_user_jobs(current_user.user_id, db, limit=page_size)
    return {
        "jobs": [
            {
                "jobId": j.id,
                "status": j.status,
                "createdAt": j.createdAt,
                "completedAt": getattr(j, "completedAt", None),
                "error": getattr(j, "errorMessage", None),
            }
            for j in jobs
        ],
        "page": page,
        "pageSize": page_size,
    }


# ── GET /api/3d/jobs/{jobId} --------------------------------------------------


@router.get(
    "/3d/jobs/{job_id}",
    response_model=JobStatusResponse,
    summary="Poll job status (Redis-first, DB fallback)",
)
async def get_job_status(
    job_id: str,
    request: Request,
    current_user: Annotated[TokenPayload, Depends(get_current_user)],
    db=Depends(get_db),
) -> JobStatusResponse:
    cache = _get_cache(request)

    job_data = await get_job(
        job_id=job_id, user_id=current_user.user_id, db=db, cache=cache
    )
    if not job_data:
        raise HTTPException(status_code=404, detail="Job not found")

    return JobStatusResponse(
        jobId=job_data["id"],
        status=job_data["status"],
        progress=job_data.get("progress", 0),
        currentStage=job_data.get("currentStage"),
        errorMessage=job_data.get("errorMessage"),
        createdAt=job_data["createdAt"],
        completedAt=job_data.get("completedAt"),
    )


# ── GET /api/3d/jobs/{jobId}/result -------------------------------------------


@router.get(
    "/3d/jobs/{job_id}/result",
    summary="302 redirect to a presigned S3 URL for the finished GLB",
    response_class=RedirectResponse,
)
async def get_job_result(
    job_id: str,
    request: Request,
    current_user: Annotated[TokenPayload, Depends(get_current_user)],
    db=Depends(get_db),
) -> RedirectResponse:
    cache = _get_cache(request)

    job_data = await get_job(
        job_id=job_id, user_id=current_user.user_id, db=db, cache=cache
    )
    if not job_data:
        raise HTTPException(status_code=404, detail="Job not found")

    if job_data.get("status") != "COMPLETED":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Job is not complete yet (status={job_data.get('status')})",
        )

    result_key = job_data.get("resultS3Key")
    if not result_key:
        raise HTTPException(
            status_code=500, detail="Result key missing from completed job"
        )

    try:
        presigned = await s3_service.generate_presigned_url(
            result_key, ttl=_PRESIGNED_TTL
        )
    except Exception as exc:
        logger.exception("Presign failed for job %s key %s", job_id, result_key)
        raise HTTPException(
            status_code=500, detail="Could not generate result URL"
        ) from exc

    return RedirectResponse(url=presigned, status_code=status.HTTP_302_FOUND)
