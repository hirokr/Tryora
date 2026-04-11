"""Service orchestration for profile CRUD and consent-gated operations."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from .constants import DEFAULT_CONSENT_TYPE
from .domain import UserProfile, split_sensitive_updates
from .policies import ProfilePolicy
from .repository import ConsentGateway, ConsentRepository, EraseGateway, ProfileRepository


class ProfilesService:
    """Application service for profile-related use cases."""

    def __init__(
        self,
        *,
        profile_repository: ProfileRepository,
        consent_repository: ConsentRepository,
        consent_gateway: ConsentGateway,
        erase_gateway: EraseGateway,
    ) -> None:
        self._profiles = profile_repository
        self._consents = consent_repository
        self._consent_gateway = consent_gateway
        self._erase_gateway = erase_gateway

    async def get_or_create_profile(self, *, user_id: str) -> UserProfile:
        profile_record = await self._profiles.get_active_profile(user_id)
        if profile_record is None:
            profile_record = await self._profiles.upsert_profile(user_id, {})
        return UserProfile.from_record(profile_record).masked()

    async def update_profile(self, *, user_id: str, update_data: dict[str, Any]) -> UserProfile:
        clean_data, sensitive_fields = split_sensitive_updates(update_data)
        has_consent = await self._consents.has_granted_consent(user_id, DEFAULT_CONSENT_TYPE)

        ProfilePolicy.ensure_sensitive_write_allowed(
            requested_sensitive_fields=sensitive_fields,
            has_required_consent=has_consent,
            consent_type=DEFAULT_CONSENT_TYPE,
        )

        updated_record = await self._profiles.upsert_profile(user_id, clean_data)
        return UserProfile.from_record(updated_record).masked()

    async def record_consent(
        self,
        *,
        user_id: str,
        consent_type: str,
        granted: bool,
        ip_address: str,
        user_agent: str,
    ) -> dict[str, Any]:
        decision = await self._consent_gateway.record_consent(
            user_id=user_id,
            consent_type=consent_type,
            granted=granted,
            ip_address=ip_address,
            user_agent=user_agent,
        )

        return {
            "consentType": decision.consent_type,
            "granted": decision.granted,
            "recordedAt": decision.recorded_at.isoformat(),
        }

    async def erase_profile(self, *, user_id: str) -> dict[str, str]:
        ticket_id = await self._erase_gateway.erase_user(user_id=user_id)
        return {
            "ticketId": ticket_id,
            "deletedAt": datetime.now(timezone.utc).isoformat(),
            "message": "Your data has been scheduled for deletion. Ticket ID saved for support reference.",
        }