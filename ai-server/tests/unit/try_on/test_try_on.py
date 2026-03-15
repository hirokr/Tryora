"""
test_try_on.py — integration-style tests for /api/3d/try-on and /api/3d/jobs/*
"""
from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import AsyncClient


class TestSubmitTryOn:
    @pytest.mark.asyncio
    async def test_requires_auth(self, async_client: AsyncClient):
        resp = await async_client.post("/api/3d/try-on", json={"templateDressId": "t1"})
        assert resp.status_code == 403

    @pytest.mark.asyncio
    async def test_returns_202_with_job_id(
        self, async_client: AsyncClient, valid_token: str, mock_cache: MagicMock
    ):
        import datetime

        mock_job = MagicMock()
        mock_job.id = "job-abc"
        mock_job.status = "PENDING"
        mock_job.createdAt = datetime.datetime(2025, 1, 1, tzinfo=datetime.timezone.utc)

        mock_cache.check_and_increment_rate = AsyncMock(return_value=(True, 1))
        mock_cache.check_and_increment_global_rate = AsyncMock(return_value=(True, 1))

        with (
            patch("app.api.try_on.create_job", AsyncMock(return_value=mock_job)),
            patch("app.api.try_on.s3_service"),
            patch("app.workers.try_on_task.run_try_on") as mock_task,
            patch("app.db.prisma_connect.db"),
        ):
            mock_task.delay = MagicMock()
            resp = await async_client.post(
                "/api/3d/try-on",
                json={"templateDressId": "tmpl-1"},
                headers={"Authorization": f"Bearer {valid_token}"},
            )

        assert resp.status_code == 202
        body = resp.json()
        assert body["jobId"] == "job-abc"
        assert body["status"] == "PENDING"

    @pytest.mark.asyncio
    async def test_rate_limit_blocks_request(
        self, async_client: AsyncClient, valid_token: str, mock_cache: MagicMock
    ):
        mock_cache.check_and_increment_rate = AsyncMock(return_value=(False, 11))

        with patch("app.db.prisma_connect.db"):
            resp = await async_client.post(
                "/api/3d/try-on",
                json={"templateDressId": "tmpl-1"},
                headers={"Authorization": f"Bearer {valid_token}"},
            )

        assert resp.status_code == 429


class TestGetJobStatus:
    @pytest.mark.asyncio
    async def test_returns_job_status_from_cache(
        self, async_client: AsyncClient, valid_token: str, mock_cache: MagicMock
    ):
        import datetime

        job_data = {
            "id": "job-abc",
            "status": "PROCESSING",
            "progress": 50,
            "resultS3Key": None,
            "error": None,
            "createdAt": "2025-01-01T00:00:00Z",
            "completedAt": None,
        }

        with (
            patch("app.api.try_on.get_job", AsyncMock(return_value=job_data)),
            patch("app.db.prisma_connect.db"),
        ):
            resp = await async_client.get(
                "/api/3d/jobs/job-abc",
                headers={"Authorization": f"Bearer {valid_token}"},
            )

        assert resp.status_code == 200
        body = resp.json()
        assert body["status"] == "PROCESSING"
        assert body["progress"] == 50

    @pytest.mark.asyncio
    async def test_404_for_missing_job(
        self, async_client: AsyncClient, valid_token: str
    ):
        with (
            patch("app.api.try_on.get_job", AsyncMock(return_value=None)),
            patch("app.db.prisma_connect.db"),
        ):
            resp = await async_client.get(
                "/api/3d/jobs/nonexistent",
                headers={"Authorization": f"Bearer {valid_token}"},
            )

        assert resp.status_code == 404


class TestGetJobResult:
    @pytest.mark.asyncio
    async def test_redirects_to_presigned_url_when_complete(
        self, async_client: AsyncClient, valid_token: str, mock_s3: MagicMock
    ):
        job_data = {
            "id": "job-abc",
            "status": "COMPLETED",
            "resultS3Key": "user-123/results/job-abc.glb",
            "createdAt": "2025-01-01T00:00:00Z",
        }

        with (
            patch("app.api.try_on.get_job", AsyncMock(return_value=job_data)),
            patch("app.api.try_on.s3_service", mock_s3),
            patch("app.db.prisma_connect.db"),
        ):
            resp = await async_client.get(
                "/api/3d/jobs/job-abc/result",
                headers={"Authorization": f"Bearer {valid_token}"},
                follow_redirects=False,
            )

        assert resp.status_code == 302
        assert "s3.example.com" in resp.headers.get("location", "")

    @pytest.mark.asyncio
    async def test_409_when_job_not_complete(
        self, async_client: AsyncClient, valid_token: str
    ):
        job_data = {
            "id": "job-abc",
            "status": "PROCESSING",
            "createdAt": "2025-01-01T00:00:00Z",
        }

        with (
            patch("app.api.try_on.get_job", AsyncMock(return_value=job_data)),
            patch("app.db.prisma_connect.db"),
        ):
            resp = await async_client.get(
                "/api/3d/jobs/job-abc/result",
                headers={"Authorization": f"Bearer {valid_token}"},
            )

        assert resp.status_code == 409
