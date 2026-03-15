"""
test_tripo_client.py — unit tests for TripoClient
"""
from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.services.tripo_client import OfflineModeError, TripoAPIError, TripoTaskFailed


class TestTripoClientOfflineMode:
    @pytest.mark.asyncio
    async def test_raises_offline_error_when_offline(self):
        with patch("app.services.tripo_client.settings") as mock_settings:
            mock_settings.OFFLINE_MODE = True
            from app.services.tripo_client import TripoClient
            client = TripoClient()
            with pytest.raises(OfflineModeError):
                await client.image_to_3d("https://example.com/dress.jpg")


class TestTripoClientImageTo3D:
    @pytest.mark.asyncio
    async def test_returns_task_id_on_success(self):
        with (
            patch("app.services.tripo_client.settings") as mock_settings,
            patch("app.services.tripo_client.httpx.AsyncClient") as MockHttpx,
        ):
            mock_settings.OFFLINE_MODE = False
            mock_settings.TRIPO_API_KEY = "test-key"

            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.json.return_value = {
                "code": 0,
                "data": {"task_id": "task-abc-123"},
            }
            mock_session = AsyncMock()
            mock_session.__aenter__ = AsyncMock(return_value=mock_session)
            mock_session.__aexit__ = AsyncMock(return_value=False)
            mock_session.post = AsyncMock(return_value=mock_response)
            MockHttpx.return_value = mock_session

            from app.services.tripo_client import TripoClient
            client = TripoClient()
            task_id = await client.image_to_3d("https://example.com/dress.jpg")
            assert task_id == "task-abc-123"

    @pytest.mark.asyncio
    async def test_raises_api_error_on_non_zero_code(self):
        with (
            patch("app.services.tripo_client.settings") as mock_settings,
            patch("app.services.tripo_client.httpx.AsyncClient") as MockHttpx,
        ):
            mock_settings.OFFLINE_MODE = False
            mock_settings.TRIPO_API_KEY = "test-key"

            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.json.return_value = {"code": 400, "message": "Bad request"}
            mock_session = AsyncMock()
            mock_session.__aenter__ = AsyncMock(return_value=mock_session)
            mock_session.__aexit__ = AsyncMock(return_value=False)
            mock_session.post = AsyncMock(return_value=mock_response)
            MockHttpx.return_value = mock_session

            from app.services.tripo_client import TripoClient
            client = TripoClient()
            with pytest.raises(TripoAPIError):
                await client.image_to_3d("https://example.com/dress.jpg")


class TestPollUntilDone:
    @pytest.mark.asyncio
    async def test_returns_result_when_success(self):
        with (
            patch("app.services.tripo_client.settings") as mock_settings,
            patch("app.services.tripo_client.httpx.AsyncClient") as MockHttpx,
            patch("asyncio.sleep", new_callable=AsyncMock),
        ):
            mock_settings.OFFLINE_MODE = False
            mock_settings.TRIPO_API_KEY = "test-key"

            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.json.return_value = {
                "code": 0,
                "data": {
                    "status": "success",
                    "output": {"pbr_model": "https://tripo.cdn/model.glb"},
                },
            }
            mock_session = AsyncMock()
            mock_session.__aenter__ = AsyncMock(return_value=mock_session)
            mock_session.__aexit__ = AsyncMock(return_value=False)
            mock_session.get = AsyncMock(return_value=mock_response)
            MockHttpx.return_value = mock_session

            from app.services.tripo_client import TripoClient
            client = TripoClient()
            result = await client.poll_until_done("task-xyz", max_wait=10, interval=1)
            assert result["output"]["pbr_model"] == "https://tripo.cdn/model.glb"

    @pytest.mark.asyncio
    async def test_raises_task_failed_on_failure_status(self):
        with (
            patch("app.services.tripo_client.settings") as mock_settings,
            patch("app.services.tripo_client.httpx.AsyncClient") as MockHttpx,
            patch("asyncio.sleep", new_callable=AsyncMock),
        ):
            mock_settings.OFFLINE_MODE = False
            mock_settings.TRIPO_API_KEY = "test-key"

            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.json.return_value = {
                "code": 0,
                "data": {"status": "failed", "message": "Generation failed"},
            }
            mock_session = AsyncMock()
            mock_session.__aenter__ = AsyncMock(return_value=mock_session)
            mock_session.__aexit__ = AsyncMock(return_value=False)
            mock_session.get = AsyncMock(return_value=mock_response)
            MockHttpx.return_value = mock_session

            from app.services.tripo_client import TripoClient
            client = TripoClient()
            with pytest.raises(TripoTaskFailed):
                await client.poll_until_done("task-xyz", max_wait=10, interval=1)
