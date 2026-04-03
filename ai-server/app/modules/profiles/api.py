"""
profile.py — /api/profile/* routes
-------------------------------------
GET    /api/profile/me          — get own UserProfile
PUT    /api/profile/me          — update non-sensitive (or sensitive with consent)
POST   /api/profile/consent     — record a consent decision
DELETE /api/profile/me          — GDPR right-to-erase (soft-delete + purge)
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.api.deps import get_db
from app.infrastructure.db.repositories.user_profile_repo import check_consent, get_profile, upsert_profile
from app.shared.security.jwt import TokenPayload, get_current_user
from app.modules.profiles.schemas import (
    ConsentRequest,
    ConsentResponse,
    GdprEraseResponse,
    ProfileResponse,
    ProfileUpdateRequest,
)
from app.infrastructure.cache.cache_service import CacheService
from app.modules.consent.service import record_consent, gdpr_erase
from app.infrastructure.storage.s3 import s3_service

logger = logging.getLogger("api_security")

router = APIRouter(tags=["Profile"])

_SENSITIVE_FIELDS = {"ethnicity", "gender", "location", "preferences"}


def _get_cache(request: Request) -> CacheService:
    cache: CacheService | None = getattr(request.app.state, "cache", None)
    if cache is None:
        raise HTTPException(status_code=503, detail="Cache service unavailable")
    return cache


# ── GET /api/profile/me -------------------------------------------------------

@router.get("/profile/me", response_model=ProfileResponse, summary="Get own profile")
async def get_my_profile(
    current_user: Annotated[TokenPayload, Depends(get_current_user)],
    db=Depends(get_db),
) -> ProfileResponse:
    profile = await get_profile(current_user.user_id, db)
    if not profile:
        # Auto-create an empty profile on first fetch
        profile = await upsert_profile(current_user.user_id, {}, db)

    # Mask sensitive fields if consent was not given
    ethnicity = profile.ethnicity if profile.consentGiven else None
    gender = profile.gender if profile.consentGiven else None
    location = profile.location if profile.consentGiven else None
    preferences = profile.preferences if profile.consentGiven else None

    return ProfileResponse(
        id=profile.id,
        userId=profile.userId,
        measHeight=profile.measHeight,
        measChest=profile.measChest,
        measWaist=profile.measWaist,
        measHips=profile.measHips,
        measShoulders=profile.measShoulders,
        tHeight=profile.tHeight,
        tFullness=profile.tFullness,
        bodyLabel=profile.bodyLabel,
        ethnicity=ethnicity,
        gender=gender,
        location=location,
        preferences=preferences,
        consentGiven=profile.consentGiven,
        consentAt=profile.consentAt,
    )


# ── PUT /api/profile/me -------------------------------------------------------

@router.put("/profile/me", response_model=ProfileResponse, summary="Update own profile")
async def update_my_profile(
    body: ProfileUpdateRequest,
    current_user: Annotated[TokenPayload, Depends(get_current_user)],
    db=Depends(get_db),
) -> ProfileResponse:
    profile = await get_profile(current_user.user_id, db)

    # Check if any sensitive field is being written
    update_data = body.model_dump(exclude_none=True)
    sensitive_requested = _SENSITIVE_FIELDS & set(update_data.keys())

    if sensitive_requested:
        has_consent = await check_consent(current_user.user_id, "ETHNICITY_DATA", db)
        if not has_consent:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "ETHNICITY_DATA consent is required before writing sensitive fields. "
                    "Call POST /api/profile/consent first."
                ),
            )

    updated = await upsert_profile(current_user.user_id, update_data, db)

    ethnicity = updated.ethnicity if updated.consentGiven else None
    gender = updated.gender if updated.consentGiven else None
    location = updated.location if updated.consentGiven else None
    preferences = updated.preferences if updated.consentGiven else None

    return ProfileResponse(
        id=updated.id,
        userId=updated.userId,
        measHeight=updated.measHeight,
        measChest=updated.measChest,
        measWaist=updated.measWaist,
        measHips=updated.measHips,
        measShoulders=updated.measShoulders,
        tHeight=updated.tHeight,
        tFullness=updated.tFullness,
        bodyLabel=updated.bodyLabel,
        ethnicity=ethnicity,
        gender=gender,
        location=location,
        preferences=preferences,
        consentGiven=updated.consentGiven,
        consentAt=updated.consentAt,
    )


# ── POST /api/profile/consent -------------------------------------------------

@router.post(
    "/profile/consent",
    response_model=ConsentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Record consent decision",
)
async def post_consent(
    body: ConsentRequest,
    request: Request,
    current_user: Annotated[TokenPayload, Depends(get_current_user)],
    db=Depends(get_db),
) -> ConsentResponse:
    ip = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("User-Agent", "unknown")

    result = await record_consent(
        user_id=current_user.user_id,
        consent_type=body.consentType,
        granted=body.granted,
        ip_address=ip,
        user_agent=user_agent,
        db=db,
    )
    return ConsentResponse(**result)


# ── DELETE /api/profile/me (GDPR) ---------------------------------------------

@router.delete(
    "/profile/me",
    response_model=GdprEraseResponse,
    summary="GDPR right-to-erase (soft-delete + cache/S3 purge)",
)
async def erase_my_profile(
    request: Request,
    current_user: Annotated[TokenPayload, Depends(get_current_user)],
    db=Depends(get_db),
) -> GdprEraseResponse:
    cache = _get_cache(request)

    ticket_id = await gdpr_erase(
        user_id=current_user.user_id,
        db=db,
        cache=cache,
        s3=s3_service,
    )
    now = datetime.now(timezone.utc).isoformat()
    return GdprEraseResponse(
        ticketId=ticket_id,
        deletedAt=now,
        message="Your data has been scheduled for deletion. Ticket ID saved for support reference.",
    )
