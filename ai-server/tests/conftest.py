"""
conftest.py — pytest fixtures shared across test modules
----------------------------------------------------------
Provides:
  - async_client: AsyncClient against the real FastAPI app (DB + Redis mocked)
  - mock_db: a patched Prisma client that returns None / empty by default
  - mock_cache: a patched CacheService
  - mock_s3: a patched S3Service
  - mock_tripo: a patched TripoClient
  - valid_token / admin_token: pre-built JWT strings for auth tests
"""
from __future__ import annotations

import json
from datetime import datetime, timezone, timedelta
from typing import AsyncGenerator
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
import pytest_asyncio
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient
from jose import jwt


# ── JWT helpers ───────────────────────────────────────────────────────────────

_TEST_SECRET = "test-secret-for-unit-tests"
_ALGORITHM = "HS256"


def _make_token(user_id: str = "user-123", email: str = "test@example.com", role: str = "USER") -> str:
    payload = {
        "sub": user_id,
        "userId": user_id,
        "email": email,
        "role": role,
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(hours=1),
    }
    return jwt.encode(payload, _TEST_SECRET, algorithm=_ALGORITHM)


@pytest.fixture()
def valid_token() -> str:
    return _make_token()


@pytest.fixture()
def admin_token() -> str:
    return _make_token(user_id="admin-001", email="admin@example.com", role="ADMIN")


# ── Mock Redis / CacheService ─────────────────────────────────────────────────

@pytest.fixture()
def mock_cache():
    cache = MagicMock()
    cache.get_glb = AsyncMock(return_value=None)
    cache.set_glb = AsyncMock()
    cache.delete_pattern = AsyncMock(return_value=0)
    cache.get_job_status = AsyncMock(return_value=None)
    cache.set_job_status = AsyncMock()
    cache.check_and_increment_rate = AsyncMock(return_value=(True, 1))
    cache.check_and_increment_global_rate = AsyncMock(return_value=(True, 1))
    cache.get_stats = AsyncMock(return_value={"glb_keys": 0, "total_keys": 0})
    cache.key_result = MagicMock(return_value="glb:result:user-123:job-abc")
    cache.key_template_dress = MagicMock(return_value="glb:dress:template:tmpl-1:universal")
    cache.key_base_avatar = MagicMock(return_value="glb:avatar:user-123")
    cache.key_job_status = MagicMock(return_value="job:user-123:job-abc")
    return cache


# ── Mock S3Service ────────────────────────────────────────────────────────────

@pytest.fixture()
def mock_s3():
    s3 = MagicMock()
    s3.upload_bytes = AsyncMock()
    s3.download_bytes = AsyncMock(return_value=b"glb-bytes")
    s3.generate_presigned_url = AsyncMock(return_value="https://s3.example.com/presigned")
    s3.delete_object = AsyncMock()
    s3.purge_prefix = AsyncMock(return_value=0)
    s3.key_dress_upload = MagicMock(return_value="user-123/dress-uploads/abc.jpg")
    s3.key_try_on_result = MagicMock(return_value="user-123/results/job-abc.glb")
    s3.key_catalog_variant = MagicMock(return_value="catalog/tmpl-1/universal.glb")
    return s3


# ── Mock TripoClient ──────────────────────────────────────────────────────────

@pytest.fixture()
def mock_tripo():
    tripo = MagicMock()
    tripo.image_to_3d = AsyncMock(return_value="task-xyz")
    tripo.poll_until_done = AsyncMock(
        return_value={"output": {"pbr_model": "https://tripo.example.com/model.glb"}}
    )
    tripo.download_glb = AsyncMock(return_value=b"\x00\x00GLB_BYTES")
    return tripo


# ── FastAPI test client ───────────────────────────────────────────────────────

@pytest_asyncio.fixture()
async def async_client(mock_cache, mock_s3) -> AsyncGenerator[AsyncClient, None]:
    """AsyncClient with DB and Redis dependencies mocked at app.state level."""
    from app.main import app as _app
    from app.config.settings import settings

    # Patch JWT secret so test tokens are valid
    with (
        patch.object(settings, "JWT_SECRET", _TEST_SECRET),
        patch.object(settings, "JWT_ALGORITHM", _ALGORITHM),
        patch("app.db.prisma_connect.db") as mock_db_obj,
    ):
        # Minimal Prisma stubs
        mock_db_obj.is_connected.return_value = True

        # Set app.state directly
        _app.state.cache = mock_cache
        _app.state.redis = MagicMock()

        transport = ASGITransport(app=_app)
        async with AsyncClient(transport=transport, base_url="http://testserver") as client:
            yield client
