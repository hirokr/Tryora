"""
profile.py — /api/profile/* routes
-------------------------------------
GET    /api/profile/me          — get own UserProfile
PUT    /api/profile/me          — update non-sensitive (or sensitive with consent)
POST   /api/profile/consent     — record a consent decision
DELETE /api/profile/me          — GDPR right-to-erase (soft-delete + purge)
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.api.deps import get_db
from app.infrastructure.cache.cache_service import CacheService
from app.infrastructure.db.repositories.user_profile_repo import check_consent, get_profile, upsert_profile
from app.infrastructure.storage.storage_service import storage_service
from app.modules.consent.service import gdpr_erase, record_consent
from app.modules.profiles.repository import ConsentDecision
from app.modules.profiles.schemas import ConsentRequest, ConsentResponse, GdprEraseResponse, ProfileResponse, ProfileUpdateRequest
from app.modules.profiles.service import ProfilesService
from app.shared.security.jwt import TokenPayload, get_current_user

router = APIRouter(tags=["Profile"])


@dataclass
class _ProfileRepoAdapter:
    db: Any

    async def get_active_profile(self, user_id: str) -> Any:
        return await get_profile(user_id, self.db)

    async def upsert_profile(self, user_id: str, data: dict[str, Any]) -> Any:
        return await upsert_profile(user_id, data, self.db)


@dataclass
class _ConsentRepoAdapter:
    db: Any

    async def has_granted_consent(self, user_id: str, consent_type: str) -> bool:
        return await check_consent(user_id, consent_type, self.db)


@dataclass
class _ConsentGatewayAdapter:
    db: Any

    async def record_consent(
        self,
        *,
        user_id: str,
        consent_type: str,
        granted: bool,
        ip_address: str,
        user_agent: str,
    ) -> ConsentDecision:
        result = await record_consent(
            user_id=user_id,
            consent_type=consent_type,
            granted=granted,
            ip_address=ip_address,
            user_agent=user_agent,
            db=self.db,
        )
        return ConsentDecision(
            consent_type=result["consentType"],
            granted=result["granted"],
            recorded_at=datetime.fromisoformat(result["recordedAt"]),
        )


@dataclass
class _EraseGatewayAdapter:
    db: Any
    cache: CacheService

    async def erase_user(self, *, user_id: str) -> str:
        return await gdpr_erase(user_id=user_id, db=self.db, cache=self.cache, s3=storage_service)


def _service_factory(db: Any, cache: CacheService) -> ProfilesService:
    return ProfilesService(
        profile_repository=_ProfileRepoAdapter(db),
        consent_repository=_ConsentRepoAdapter(db),
        consent_gateway=_ConsentGatewayAdapter(db),
        erase_gateway=_EraseGatewayAdapter(db, cache),
    )

from app.modules.profiles.schemas import ProfileResponse

def _attr(obj: Any, snake: str, camel: str, default: Any = None) -> Any:
    """
    Read an attribute from either a domain model (snake_case) or a raw
    Prisma record (camelCase), returning *default* if neither is present.
    This makes _to_profile_response() safe regardless of which object type
    a service method accidentally returns.
    """
    v = getattr(obj, snake, None)
    if v is None:
        v = getattr(obj, camel, None)
    return v if v is not None else default


def _to_profile_response(profile: Any) -> ProfileResponse:
    """
    Map a domain.UserProfile (snake_case) or a raw Prisma UserProfile
    record (camelCase) to a ProfileResponse.
 
    Both object shapes are handled so that any code path — whether it goes
    through ProfilesService (returns domain.UserProfile) or directly queries
    Prisma (returns a Prisma record) — produces a correctly populated
    response with no silent None fields.
    """
    return ProfileResponse(
        id=_attr(profile, "id", "id", ""),
        userId=_attr(profile, "user_id", "userId", ""),
        measHeight=_attr(profile, "meas_height", "measHeight"),
        measChest=_attr(profile, "meas_chest", "measChest"),
        measWaist=_attr(profile, "meas_waist", "measWaist"),
        measHips=_attr(profile, "meas_hips", "measHips"),
        measShoulders=_attr(profile, "meas_shoulders", "measShoulders"),
        tHeight=_attr(profile, "t_height", "tHeight"),
        tFullness=_attr(profile, "t_fullness", "tFullness"),
        bodyLabel=_attr(profile, "body_label", "bodyLabel"),
        ethnicity=_attr(profile, "ethnicity", "ethnicity"),
        gender=_attr(profile, "gender", "gender"),
        location=_attr(profile, "location", "location"),
        preferences=_attr(profile, "preferences", "preferences"),
        consentGiven=bool(_attr(profile, "consent_given", "consentGiven", False)),
        consentAt=_attr(profile, "consent_at", "consentAt"),
    )

def _get_cache(request: Request) -> CacheService:
    cache: CacheService | None = getattr(request.app.state, "cache", None)
    if cache is None:
        raise HTTPException(status_code=503, detail="Cache service unavailable")
    return cache


# ── GET /api/profile/me -------------------------------------------------------

@router.get("/profile/me", response_model=ProfileResponse, summary="Get own profile")
async def get_my_profile(
    request: Request,
    current_user: Annotated[TokenPayload, Depends(get_current_user)],
    db=Depends(get_db),
) -> ProfileResponse:
    service = _service_factory(db, _get_cache(request))
    profile = await service.get_or_create_profile(user_id=current_user.user_id)
    return _to_profile_response(profile)


# ── PUT /api/profile/me -------------------------------------------------------

@router.put("/profile/me", response_model=ProfileResponse, summary="Update own profile")
async def update_my_profile(
    body: ProfileUpdateRequest,
    request: Request,
    current_user: Annotated[TokenPayload, Depends(get_current_user)],
    db=Depends(get_db),
) -> ProfileResponse:
    service = _service_factory(db, _get_cache(request))
    profile = await service.update_profile(
        user_id=current_user.user_id,
        update_data=body.model_dump(exclude_none=True),
    )
    return _to_profile_response(profile)


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
    service = _service_factory(db, _get_cache(request))
    ip = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("User-Agent", "unknown")

    result = await service.record_consent(
        user_id=current_user.user_id,
        consent_type=body.consentType,
        granted=body.granted,
        ip_address=ip,
        user_agent=user_agent,
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
    service = _service_factory(db, _get_cache(request))
    result = await service.erase_profile(user_id=current_user.user_id)
    return GdprEraseResponse(**result)
