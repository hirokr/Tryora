"""
test_profile.py — integration-style tests for /api/profile/* endpoints
"""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
import pytest_asyncio
from httpx import AsyncClient


# ── Fixtures come from conftest.py ────────────────────────────────────────────


class TestGetProfile:
    @pytest.mark.asyncio
    async def test_requires_auth(self, async_client: AsyncClient):
        resp = await async_client.get("/api/profile/me")
        assert resp.status_code == 403  # missing bearer token

    @pytest.mark.asyncio
    async def test_returns_empty_profile_on_first_fetch(
        self, async_client: AsyncClient, valid_token: str
    ):
        empty_profile = MagicMock()
        empty_profile.id = "profile-1"
        empty_profile.userId = "user-123"
        empty_profile.measHeight = None
        empty_profile.measChest = None
        empty_profile.measWaist = None
        empty_profile.measHips = None
        empty_profile.measShoulders = None
        empty_profile.tHeight = None
        empty_profile.tFullness = None
        empty_profile.bodyLabel = None
        empty_profile.ethnicity = None
        empty_profile.gender = None
        empty_profile.location = None
        empty_profile.preferences = None
        empty_profile.consentGiven = False
        empty_profile.consentAt = None

        with (
            patch("app.modules.profiles.api.get_profile", AsyncMock(return_value=None)),
            patch(
                "app.modules.profiles.api.upsert_profile",
                AsyncMock(return_value=empty_profile),
            ),
            patch("app.db.prisma_connect.db"),
        ):
            resp = await async_client.get(
                "/api/profile/me",
                headers={"Authorization": f"Bearer {valid_token}"},
            )
        assert resp.status_code == 200
        data = resp.json()
        assert data["userId"] == "user-123"
        assert data["consentGiven"] is False


class TestUpdateProfile:
    @pytest.mark.asyncio
    async def test_update_non_sensitive_fields(
        self, async_client: AsyncClient, valid_token: str
    ):
        updated = MagicMock()
        updated.id = "profile-1"
        updated.userId = "user-123"
        updated.measHeight = 175.0
        updated.measChest = None
        updated.measWaist = None
        updated.measHips = None
        updated.measShoulders = None
        updated.tHeight = 0.6
        updated.tFullness = 0.4
        updated.bodyLabel = "AVERAGE_SLIM"
        updated.ethnicity = None
        updated.gender = None
        updated.location = None
        updated.preferences = None
        updated.consentGiven = False
        updated.consentAt = None

        with (
            patch(
                "app.modules.profiles.api.get_profile", AsyncMock(return_value=updated)
            ),
            patch(
                "app.modules.profiles.api.upsert_profile",
                AsyncMock(return_value=updated),
            ),
            patch("app.db.prisma_connect.db"),
        ):
            resp = await async_client.put(
                "/api/profile/me",
                json={"measHeight": 175.0, "tHeight": 0.6, "tFullness": 0.4},
                headers={"Authorization": f"Bearer {valid_token}"},
            )
        assert resp.status_code == 200
        assert resp.json()["measHeight"] == 175.0

    @pytest.mark.asyncio
    async def test_sensitive_fields_blocked_without_consent(
        self, async_client: AsyncClient, valid_token: str
    ):
        with (
            patch(
                "app.modules.profiles.api.get_profile",
                AsyncMock(return_value=MagicMock()),
            ),
            patch(
                "app.modules.profiles.api.check_consent", AsyncMock(return_value=False)
            ),
            patch("app.db.prisma_connect.db"),
        ):
            resp = await async_client.put(
                "/api/profile/me",
                json={"ethnicity": "asian"},
                headers={"Authorization": f"Bearer {valid_token}"},
            )
        assert resp.status_code == 403


class TestConsent:
    @pytest.mark.asyncio
    async def test_post_consent(self, async_client: AsyncClient, valid_token: str):
        consent_result = {
            "id": "consent-1",
            "userId": "user-123",
            "consentType": "ETHNICITY_DATA",
            "granted": True,
            "recordedAt": "2025-01-01T00:00:00Z",
        }
        with (
            patch(
                "app.modules.profiles.api.record_consent",
                AsyncMock(return_value=consent_result),
            ),
            patch("app.db.prisma_connect.db"),
        ):
            resp = await async_client.post(
                "/api/profile/consent",
                json={"consentType": "ETHNICITY_DATA", "granted": True},
                headers={"Authorization": f"Bearer {valid_token}"},
            )
        assert resp.status_code == 201
        assert resp.json()["consentType"] == "ETHNICITY_DATA"
