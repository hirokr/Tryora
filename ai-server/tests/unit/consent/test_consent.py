"""
test_consent.py — unit tests for consent_service
"""
from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.services.consent_service import record_consent


class TestRecordConsent:
    @pytest.mark.asyncio
    async def test_creates_consent_record(self):
        mock_db = MagicMock()
        mock_consent_record = MagicMock()
        mock_consent_record.id = "cr-1"
        mock_consent_record.userId = "user-1"
        mock_consent_record.consentType = "ETHNICITY_DATA"
        mock_consent_record.granted = True
        mock_consent_record.recordedAt = "2025-01-01T00:00:00Z"
        mock_consent_record.ipAddress = "127.0.0.1"
        mock_consent_record.userAgent = "pytest"

        mock_db.consentrecord = MagicMock()
        mock_db.consentrecord.create = AsyncMock(return_value=mock_consent_record)
        mock_db.userprofile = MagicMock()
        mock_db.userprofile.upsert = AsyncMock()

        result = await record_consent(
            user_id="user-1",
            consent_type="ETHNICITY_DATA",
            granted=True,
            ip_address="127.0.0.1",
            user_agent="pytest",
            db=mock_db,
        )

        assert result["consentType"] == "ETHNICITY_DATA"
        assert result["granted"] is True
        mock_db.consentrecord.create.assert_called_once()

    @pytest.mark.asyncio
    async def test_updates_user_profile_consent_flag(self):
        mock_db = MagicMock()
        mock_consent_record = MagicMock()
        mock_consent_record.id = "cr-2"
        mock_consent_record.userId = "user-1"
        mock_consent_record.consentType = "BODY_DATA"
        mock_consent_record.granted = True
        mock_consent_record.recordedAt = "2025-01-01T00:00:00Z"
        mock_consent_record.ipAddress = "127.0.0.1"
        mock_consent_record.userAgent = "pytest"

        mock_db.consentrecord = MagicMock()
        mock_db.consentrecord.create = AsyncMock(return_value=mock_consent_record)
        mock_db.userprofile = MagicMock()
        mock_db.userprofile.upsert = AsyncMock()

        await record_consent(
            user_id="user-1",
            consent_type="BODY_DATA",
            granted=True,
            ip_address="127.0.0.1",
            user_agent="pytest",
            db=mock_db,
        )

        mock_db.userprofile.upsert.assert_called_once()


class TestGdprErase:
    @pytest.mark.asyncio
    async def test_returns_ticket_id(self):
        from app.services.consent_service import gdpr_erase

        mock_db = MagicMock()
        mock_db.userprofile.update_many = AsyncMock()
        mock_db.generationjob.update_many = AsyncMock()
        mock_db.consentrecord.delete_many = AsyncMock()

        mock_cache = MagicMock()
        mock_cache.delete_pattern = AsyncMock(return_value=5)

        mock_s3 = MagicMock()
        mock_s3.purge_prefix = AsyncMock(return_value=3)

        ticket = await gdpr_erase(
            user_id="user-1",
            db=mock_db,
            cache=mock_cache,
            s3=mock_s3,
        )

        # Must be a non-empty string (UUID)
        assert isinstance(ticket, str)
        assert len(ticket) > 10
