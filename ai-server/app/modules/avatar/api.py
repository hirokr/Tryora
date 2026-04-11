"""
api.py — /api/3d/avatar/* routes
----------------------------------
POST   /api/3d/avatar/generate         — enqueue a new avatar generation job
GET    /api/3d/avatar/jobs/{jobId}     — poll job status + progress
GET    /api/3d/avatar/jobs/{jobId}/result — 302 redirect to presigned GLB URL
GET    /api/3d/avatar/me               — get the current user's latest avatar GLB URL

Auth: JWT required on all endpoints.
"""
from __future__ import annotations

import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import RedirectResponse

from app.api.deps import get_db
from app.config.settings import settings
from app.infrastructure.cache.cache_service import CacheService
from app.infrastructure.storage.s3 import s3_service
from app.modules.avatar.schemas import (
    AvatarGenerateRequest,
    AvatarGenerateResponse,
    AvatarJobStatusResponse,
)
from app.modules.avatar.service import create_avatar_job, get_avatar_job
from app.shared.security.jwt import TokenPayload, get_current_user

logger = logging.getLogger("api.avatar")

router = APIRouter(tags=["3D Avatar"])

_PRESIGNED_TTL = 900      # 15 minutes
_MAX_TRIPO_PER_USER = settings.MAX_TRIPO_CALLS_PER_USER
_RATE_WINDOW       = settings.TRIPO_RATE_WINDOW_SECONDS
_MAX_TRIPO_GLOBAL  = settings.MAX_TRIPO_CALLS_GLOBAL


def _get_cache(request: Request) -> CacheService:
    cache = getattr(request.app.state, "cache", None)
    if cache is None:
        raise HTTPException(status_code=503, detail="Cache service unavailable")
    return cache


# ── POST /api/3d/avatar/generate ─────────────────────────────────────────────

@router.post(
    "/3d/avatar/generate",
    response_model=AvatarGenerateResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Enqueue a 3D avatar generation job from photos",
    description=(
        "Accepts S3 keys for 1–3 photos (front required; side and back improve "
        "quality). Returns a jobId immediately — poll /api/3d/avatar/jobs/{jobId} "
        "for progress. Upload photos first via POST /api/3d/upload/dress-image."
    ),
)
async def generate_avatar(
    body: AvatarGenerateRequest,
    request: Request,
    current_user: Annotated[TokenPayload, Depends(get_current_user)],
    db=Depends(get_db),
) -> AvatarGenerateResponse:
    cache = _get_cache(request)

    # ── Validate photo ownership ─────────────────────────────────────────────
    # S3 keys for user uploads follow the pattern uploads/dresses/{userId}/...
    # We enforce that the caller's userId is in the path.
    expected_prefix = f"uploads/dresses/{current_user.user_id}/"
    for key_field, key_value in [
        ("frontPhotoS3Key", body.frontPhotoS3Key),
        ("sidePhotoS3Key",  body.sidePhotoS3Key),
        ("backPhotoS3Key",  body.backPhotoS3Key),
    ]:
        if key_value and not key_value.startswith(expected_prefix):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    f"{key_field}: you can only use photos you uploaded yourself. "
                    f"Key must start with '{expected_prefix}'."
                ),
            )

    # ── Rate limiting (reuse Tripo counters — avatar calls go to Tripo too) ──
    allowed, _ = await cache.check_and_increment_rate(
        current_user.user_id, _MAX_TRIPO_PER_USER, _RATE_WINDOW
    )
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit: max {_MAX_TRIPO_PER_USER} generations per hour.",
        )

    g_allowed, _ = await cache.check_and_increment_global_rate(
        _MAX_TRIPO_GLOBAL, _RATE_WINDOW
    )
    if not g_allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Service is temporarily at capacity. Please try again shortly.",
        )

    # ── Create the job record ────────────────────────────────────────────────
    try:
        job = await create_avatar_job(
            user_id=current_user.user_id,
            db=db,
            front_s3_key=body.frontPhotoS3Key,
            side_s3_key=body.sidePhotoS3Key,
            back_s3_key=body.backPhotoS3Key,
            height_cm=body.heightCm,
            cache=cache,
        )
    except Exception as exc:
        logger.exception("Failed to create avatar job for user %s", current_user.user_id)
        raise HTTPException(status_code=500, detail="Failed to create job") from exc

    # ── Dispatch Celery task ─────────────────────────────────────────────────
    try:
        from app.modules.avatar.workers import generate_avatar as _task
        _task.delay(job.id, current_user.user_id)
        logger.info(
            "Avatar job dispatched: job_id=%s user_id=%s photos=[front=%s, side=%s, back=%s]",
            job.id, current_user.user_id,
            body.frontPhotoS3Key,
            body.sidePhotoS3Key or "—",
            body.backPhotoS3Key or "—",
        )
    except Exception as exc:
        logger.exception("Failed to enqueue avatar task for job %s", job.id)
        # Non-fatal: job is in DB, operator can manually re-trigger
        logger.warning("Job %s queued in DB but Celery dispatch failed", job.id)

    return AvatarGenerateResponse(
        jobId=job.id,
        status="PENDING",
        message=(
            f"Avatar generation queued. Poll GET /api/3d/avatar/jobs/{job.id} "
            "for progress updates."
        ),
    )


# ── GET /api/3d/avatar/jobs/{jobId} ──────────────────────────────────────────

@router.get(
    "/3d/avatar/jobs/{job_id}",
    response_model=AvatarJobStatusResponse,
    summary="Poll avatar job status",
)
async def get_job_status(
    job_id: str,
    request: Request,
    current_user: Annotated[TokenPayload, Depends(get_current_user)],
    db=Depends(get_db),
) -> AvatarJobStatusResponse:
    cache = _get_cache(request)
    job_data = await get_avatar_job(
        job_id=job_id, user_id=current_user.user_id, db=db, cache=cache
    )
    if not job_data:
        raise HTTPException(status_code=404, detail="Job not found")

    return AvatarJobStatusResponse(
        jobId=job_data["id"],
        status=job_data["status"],
        progress=job_data.get("progress", 0),
        currentStage=job_data.get("currentStage"),
        provider=job_data.get("provider"),
        errorMessage=job_data.get("errorMessage"),
        createdAt=str(job_data["createdAt"]),
        completedAt=str(job_data["completedAt"]) if job_data.get("completedAt") else None,
    )


# ── GET /api/3d/avatar/jobs/{jobId}/result ────────────────────────────────────

@router.get(
    "/3d/avatar/jobs/{job_id}/result",
    summary="302 redirect to presigned GLB URL when job is COMPLETED",
    response_class=RedirectResponse,
)
async def get_job_result(
    job_id: str,
    request: Request,
    current_user: Annotated[TokenPayload, Depends(get_current_user)],
    db=Depends(get_db),
) -> RedirectResponse:
    cache = _get_cache(request)
    job_data = await get_avatar_job(
        job_id=job_id, user_id=current_user.user_id, db=db, cache=cache
    )
    if not job_data:
        raise HTTPException(status_code=404, detail="Job not found")

    if job_data["status"] != "COMPLETED":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Job is not complete yet (status={job_data['status']})",
        )

    result_key = job_data.get("resultS3Key")
    if not result_key:
        raise HTTPException(status_code=500, detail="Result key missing from job")

    try:
        url = await s3_service.generate_presigned_url(result_key, ttl=_PRESIGNED_TTL)
    except Exception as exc:
        logger.exception("Presign failed for job %s key %s", job_id, result_key)
        raise HTTPException(status_code=500, detail="Could not generate result URL") from exc

    return RedirectResponse(url=url, status_code=status.HTTP_302_FOUND)


# ── GET /api/3d/avatar/me ─────────────────────────────────────────────────────

@router.get(
    "/3d/avatar/me",
    summary="Get a presigned URL for the current user's latest avatar GLB",
    description=(
        "Returns a presigned URL for the user's base avatar stored at "
        "avatars/{userId}/base.glb in S3. Returns 404 if no avatar has been "
        "generated yet."
    ),
)
async def get_my_avatar(
    request: Request,
    current_user: Annotated[TokenPayload, Depends(get_current_user)],
) -> dict:
    cache = _get_cache(request)

    avatar_s3_key = s3_service.key_base_avatar(current_user.user_id)

    # Check Redis first for a hot cache hit
    redis_key = cache.key_base_avatar(current_user.user_id)
    cached_glb = await cache.get_glb(redis_key)
    if cached_glb:
        # GLB is in Redis — generate a presigned URL from S3 (still the source of truth)
        try:
            url = await s3_service.generate_presigned_url(avatar_s3_key, ttl=_PRESIGNED_TTL)
            return {"glbUrl": url, "source": "cache"}
        except Exception:
            pass  # S3 key may not exist yet — fall through to 404

    # Try S3 directly
    try:
        url = await s3_service.generate_presigned_url(avatar_s3_key, ttl=_PRESIGNED_TTL)
        return {"glbUrl": url, "source": "s3"}
    except Exception:
        raise HTTPException(
            status_code=404,
            detail=(
                "No avatar found. Submit photos via POST /api/3d/avatar/generate first."
            ),
        )
