"""
test_cache.py — unit tests for CacheService
"""
from __future__ import annotations

import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
import pytest_asyncio

from app.infrastructure.cache.cache_service import CacheService


def _make_redis() -> MagicMock:
    r = MagicMock()
    r.get = AsyncMock(return_value=None)
    r.set = AsyncMock()
    r.delete = AsyncMock(return_value=1)
    r.scan = AsyncMock(return_value=(b"0", []))
    r.pipeline = MagicMock(return_value=MagicMock(__aenter__=AsyncMock(), __aexit__=AsyncMock()))
    excecute_mock = AsyncMock(return_value=[1, True])
    pipe = r.pipeline.return_value.__aenter__.return_value
    pipe.incr = MagicMock()
    pipe.expire = MagicMock()
    pipe.execute = excecute_mock
    r.info = AsyncMock(return_value={"used_memory_human": "1.00M"})
    r.dbsize = AsyncMock(return_value=10)
    return r


class TestCacheKeyBuilders:
    def test_key_base_avatar(self):
        cache = CacheService(_make_redis())
        assert cache.key_base_avatar("u1") == "glb:avatar:u1"

    def test_key_template_dress(self):
        cache = CacheService(_make_redis())
        assert cache.key_template_dress("t1", "TALL_SLIM") == "glb:dress:template:t1:TALL_SLIM"

    def test_key_result(self):
        cache = CacheService(_make_redis())
        assert cache.key_result("u1", "j1") == "glb:result:u1:j1"

    def test_key_job_status(self):
        cache = CacheService(_make_redis())
        assert cache.key_job_status("u1", "j1") == "job:u1:j1"


class TestGetSetGlb:
    @pytest.mark.asyncio
    async def test_get_miss_returns_none(self):
        r = _make_redis()
        r.get = AsyncMock(return_value=None)
        cache = CacheService(r)
        result = await cache.get_glb("glb:avatar:u1")
        assert result is None

    @pytest.mark.asyncio
    async def test_get_hit_returns_bytes(self):
        glb = b"\x00glb"
        r = _make_redis()
        r.get = AsyncMock(return_value=glb)
        cache = CacheService(r)
        result = await cache.get_glb("glb:avatar:u1")
        assert result == glb

    @pytest.mark.asyncio
    async def test_set_calls_redis_set(self):
        r = _make_redis()
        cache = CacheService(r)
        await cache.set_glb("glb:avatar:u1", b"\x00glb", ttl=60)
        r.set.assert_called_once_with("glb:avatar:u1", b"\x00glb", ex=60)


class TestRateLimiting:
    @pytest.mark.asyncio
    async def test_allowed_when_under_limit(self):
        r = _make_redis()
        pipe = r.pipeline.return_value.__aenter__.return_value
        pipe.execute = AsyncMock(return_value=[3, True])
        cache = CacheService(r)
        allowed, count = await cache.check_and_increment_rate("user-1", 10, 60)
        assert allowed is True
        assert count == 3

    @pytest.mark.asyncio
    async def test_blocked_when_over_limit(self):
        r = _make_redis()
        pipe = r.pipeline.return_value.__aenter__.return_value
        pipe.execute = AsyncMock(return_value=[11, True])
        cache = CacheService(r)
        allowed, count = await cache.check_and_increment_rate("user-1", 10, 60)
        assert allowed is False
        assert count == 11
