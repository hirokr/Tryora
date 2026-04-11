"""Detailed unit tests for consent service flows."""

from __future__ import annotations

from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock
from uuid import UUID

import pytest

from app.modules.consent.service import VALID_CONSENT_TYPES, gdpr_erase, record_consent


def _build_db(consent_created_at: datetime | None = None) -> MagicMock:
    created_at = consent_created_at or datetime(2025, 1, 1, tzinfo=timezone.utc)

    consent_record = MagicMock()
    consent_record.consentType = "ETHNICITY_DATA"
    consent_record.granted = True
    consent_record.createdAt = created_at

    db = MagicMock()
    db.consentrecord = MagicMock()
    db.consentrecord.create = AsyncMock(return_value=consent_record)
    db.consentrecord.update_many = AsyncMock(return_value=1)
    db.userprofile = MagicMock()
    db.userprofile.upsert = AsyncMock(return_value=MagicMock())
    return db


class TestRecordConsent:
    @pytest.mark.asyncio
    async def test_returns_audit_payload_and_writes_consent_record(self):
        db = _build_db()

        result = await record_consent(
            user_id="user-1",
            consent_type="ETHNICITY_DATA",
            granted=True,
            ip_address="127.0.0.1",
            user_agent="pytest-agent",
            db=db,
        )

        assert result["consentType"] == "ETHNICITY_DATA"
        assert result["granted"] is True
        assert result["recordedAt"].endswith("+00:00")
        db.consentrecord.create.assert_called_once_with(
            data={
                "userId": "user-1",
                "consentType": "ETHNICITY_DATA",
                "granted": True,
                "ipAddress": "127.0.0.1",
                "userAgent": "pytest-agent",
            }
        )

    @pytest.mark.asyncio
    async def test_granted_true_sets_profile_consent_flag(self):
        db = _build_db()

        await record_consent(
            user_id="user-1",
            consent_type="BODY_DATA",
            granted=True,
            ip_address="10.0.0.8",
            user_agent="pytest",
            db=db,
        )

        db.userprofile.upsert.assert_called_once()
        payload = db.userprofile.upsert.call_args.kwargs
        assert payload["where"] == {"userId": "user-1"}
        assert payload["data"]["create"]["consentGiven"] is True
        assert payload["data"]["update"]["consentGiven"] is True

    @pytest.mark.asyncio
    async def test_granted_false_does_not_upsert_profile(self):
        db = _build_db()

        await record_consent(
            user_id="user-1",
            consent_type="IMAGE_PROCESSING",
            granted=False,
            ip_address="10.0.0.9",
            user_agent="pytest",
            db=db,
        )

        db.userprofile.upsert.assert_not_called()

    @pytest.mark.asyncio
    async def test_invalid_consent_type_raises_value_error(self):
        db = _build_db()

        with pytest.raises(ValueError, match="Invalid consent_type"):
            await record_consent(
                user_id="user-1",
                consent_type="INVALID_TYPE",
                granted=True,
                ip_address="127.0.0.1",
                user_agent="pytest",
                db=db,
            )

        db.consentrecord.create.assert_not_called()

    @pytest.mark.asyncio
    async def test_db_runtime_error_bubbles_up(self):
        db = _build_db()
        db.consentrecord.create = AsyncMock(side_effect=RuntimeError("db unavailable"))

        with pytest.raises(RuntimeError, match="db unavailable"):
            await record_consent(
                user_id="user-1",
                consent_type="ETHNICITY_DATA",
                granted=True,
                ip_address="127.0.0.1",
                user_agent="pytest",
                db=db,
            )

    def test_valid_consent_types_is_strict_and_expected(self):
        assert VALID_CONSENT_TYPES == frozenset(
            {"ETHNICITY_DATA", "IMAGE_PROCESSING", "BODY_DATA"}
        )


class TestGdprErase:
    @pytest.mark.asyncio
    async def test_runs_all_erase_steps_and_returns_uuid_ticket(self):
        db = _build_db()
        cache = MagicMock()
        cache.delete_pattern = AsyncMock(return_value=4)
        s3 = MagicMock()
        s3.purge_prefix = AsyncMock(return_value=2)

        ticket = await gdpr_erase(user_id="user-42", db=db, cache=cache, s3=s3)

        assert str(UUID(ticket)) == ticket
        db.userprofile.upsert.assert_called_once()
        cache.delete_pattern.assert_called_once_with("glb:*:user-42*")
        s3.purge_prefix.assert_called_once_with("uploads/dresses/user-42/")
        db.consentrecord.update_many.assert_called_once_with(
            where={"userId": "user-42"},
            data={"ipAddress": None, "userAgent": None},
        )

    @pytest.mark.asyncio
    @pytest.mark.parametrize("failing_step", ["step1", "step2", "step3", "step4"])
    async def test_best_effort_continues_when_any_step_fails(self, failing_step: str):
        db = _build_db()
        cache = MagicMock()
        cache.delete_pattern = AsyncMock(return_value=1)
        s3 = MagicMock()
        s3.purge_prefix = AsyncMock(return_value=1)

        if failing_step == "step1":
            db.userprofile.upsert = AsyncMock(side_effect=RuntimeError("profile fail"))
        if failing_step == "step2":
            cache.delete_pattern = AsyncMock(side_effect=RuntimeError("cache fail"))
        if failing_step == "step3":
            s3.purge_prefix = AsyncMock(side_effect=RuntimeError("s3 fail"))
        if failing_step == "step4":
            db.consentrecord.update_many = AsyncMock(side_effect=RuntimeError("audit fail"))

        ticket = await gdpr_erase(user_id="user-99", db=db, cache=cache, s3=s3)

        assert str(UUID(ticket)) == ticket
        db.userprofile.upsert.assert_called_once()
        cache.delete_pattern.assert_called_once()
        s3.purge_prefix.assert_called_once()
        db.consentrecord.update_many.assert_called_once()
