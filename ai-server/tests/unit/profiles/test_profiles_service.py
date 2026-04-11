"""Unit tests for ProfilesService orchestration and consent gating."""

from __future__ import annotations

import sys
import types
from datetime import datetime, timezone
from types import SimpleNamespace
from typing import Any, cast
from unittest.mock import AsyncMock

import pytest
from fastapi import HTTPException

# app.modules.profiles package imports api.py in __init__, which references
# app.infrastructure.storage.s3. The module is not present in this branch,
# so tests stub it to keep service-layer unit tests isolated.
if "app.infrastructure.storage.s3" not in sys.modules:
    s3_stub = types.ModuleType("app.infrastructure.storage.s3")
    setattr(s3_stub, "s3_service", object())
    sys.modules["app.infrastructure.storage.s3"] = s3_stub

from app.modules.profiles.repository import ConsentDecision
from app.modules.profiles.service import ProfilesService


def _record(*, consent_given: bool = False, ethnicity: str | None = "ASIAN") -> SimpleNamespace:
    return SimpleNamespace(
        id="profile-1",
        userId="user-123",
        measHeight=170.0,
        measChest=88.0,
        measWaist=70.0,
        measHips=95.0,
        measShoulders=42.0,
        tHeight=0.55,
        tFullness=0.40,
        bodyLabel="AVERAGE_SLIM",
        ethnicity=ethnicity,
        gender="female",
        location="Tokyo",
        preferences={"style": "minimal"},
        consentGiven=consent_given,
        consentAt=datetime(2025, 1, 1, tzinfo=timezone.utc),
    )


@pytest.fixture
def service_deps():
    profile_repository: Any = SimpleNamespace(
        get_active_profile=AsyncMock(return_value=None),
        upsert_profile=AsyncMock(return_value=_record(consent_given=False)),
    )
    consent_repository: Any = SimpleNamespace(
        has_granted_consent=AsyncMock(return_value=False),
    )
    consent_gateway: Any = SimpleNamespace(
        record_consent=AsyncMock(
            return_value=ConsentDecision(
                consent_type="ETHNICITY_DATA",
                granted=True,
                recorded_at=datetime(2025, 1, 1, tzinfo=timezone.utc),
            )
        )
    )
    erase_gateway: Any = SimpleNamespace(
        erase_user=AsyncMock(return_value="ticket-123"),
    )

    service = ProfilesService(
        profile_repository=cast(Any, profile_repository),
        consent_repository=cast(Any, consent_repository),
        consent_gateway=cast(Any, consent_gateway),
        erase_gateway=cast(Any, erase_gateway),
    )
    return service, profile_repository, consent_repository, consent_gateway, erase_gateway


@pytest.mark.asyncio
async def test_get_or_create_profile_creates_when_missing_and_masks_sensitive(service_deps):
    service, profile_repository, _, _, _ = service_deps

    result = await service.get_or_create_profile(user_id="user-123")

    profile_repository.get_active_profile.assert_called_once_with("user-123")
    profile_repository.upsert_profile.assert_called_once_with("user-123", {})
    assert result.user_id == "user-123"
    assert result.ethnicity is None
    assert result.location is None
    assert result.preferences is None


@pytest.mark.asyncio
async def test_get_or_create_profile_returns_existing_without_create(service_deps):
    service, profile_repository, _, _, _ = service_deps
    profile_repository.get_active_profile = AsyncMock(return_value=_record(consent_given=True))

    result = await service.get_or_create_profile(user_id="user-123")

    profile_repository.upsert_profile.assert_not_called()
    assert result.consent_given is True
    assert result.ethnicity == "ASIAN"


@pytest.mark.asyncio
async def test_update_non_sensitive_fields_without_consent_is_allowed(service_deps):
    service, profile_repository, consent_repository, _, _ = service_deps
    profile_repository.upsert_profile = AsyncMock(return_value=_record(consent_given=False))
    consent_repository.has_granted_consent = AsyncMock(return_value=False)

    result = await service.update_profile(
        user_id="user-123",
        update_data={"meas_height": 171.0, "t_height": 0.56},
    )

    profile_repository.upsert_profile.assert_called_once_with(
        "user-123", {"meas_height": 171.0, "t_height": 0.56}
    )
    assert result.ethnicity is None


@pytest.mark.asyncio
async def test_update_sensitive_fields_without_consent_raises_403(service_deps):
    service, _, consent_repository, _, _ = service_deps
    consent_repository.has_granted_consent = AsyncMock(return_value=False)

    with pytest.raises(HTTPException) as exc:
        await service.update_profile(
            user_id="user-123",
            update_data={"ethnicity": "ASIAN"},
        )

    assert exc.value.status_code == 403
    assert "consent is required" in exc.value.detail


@pytest.mark.asyncio
async def test_update_sensitive_fields_with_consent_is_allowed(service_deps):
    service, profile_repository, consent_repository, _, _ = service_deps
    consent_repository.has_granted_consent = AsyncMock(return_value=True)
    profile_repository.upsert_profile = AsyncMock(return_value=_record(consent_given=True))

    result = await service.update_profile(
        user_id="user-123",
        update_data={"ethnicity": "ASIAN", "location": "Osaka"},
    )

    assert result.consent_given is True
    assert result.ethnicity == "ASIAN"


@pytest.mark.asyncio
async def test_record_consent_maps_gateway_decision_to_response_payload(service_deps):
    service, _, _, consent_gateway, _ = service_deps

    result = await service.record_consent(
        user_id="user-123",
        consent_type="ETHNICITY_DATA",
        granted=True,
        ip_address="127.0.0.1",
        user_agent="pytest-agent",
    )

    consent_gateway.record_consent.assert_called_once()
    assert result["consentType"] == "ETHNICITY_DATA"
    assert result["granted"] is True
    assert result["recordedAt"].endswith("+00:00")


@pytest.mark.asyncio
async def test_erase_profile_returns_ticket_and_user_message(service_deps):
    service, _, _, _, erase_gateway = service_deps

    result = await service.erase_profile(user_id="user-123")

    erase_gateway.erase_user.assert_called_once_with(user_id="user-123")
    assert result["ticketId"] == "ticket-123"
    assert "scheduled for deletion" in result["message"]
    assert result["deletedAt"].endswith("+00:00")
