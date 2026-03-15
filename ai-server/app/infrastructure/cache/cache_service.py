"""
cache.py — Two-Layer Cache Service (Redis L1)
---------------------------------------------
All GLB bytes, job statuses, and rate-limit counters go through this service.
S3 is the L2 warm cache; callers handle S3 fallback via glb_loader.py.

Key conventions (from context.md §5):
  glb:base:{userId}                     — user's base avatar
  glb:dress:template:{id}:{bodyLabel}   — pre-baked template dress variant
  glb:dress:generated:{sha256}          — generated dress (keyed by image hash)
  glb:result:{jobId}                    — final dressed avatar output
  tripo:rate:{userId}                   — per-user Tripo rate counter
  tripo:rate:global                     — global Tripo rate counter
  job:status:{jobId}                    — job progress JSON (TTL 24 h)
  template:select:{userId}:{category}   — template selector cache (TTL 10 min)
"""
from __future__ import annotations

import json
import logging
from typing import Optional

import redis.asyncio as aioredis
from redis.exceptions import RedisError

logger = logging.getLogger("api_security")


class CacheService:
    """
    Async cache service backed by Redis.
    All methods gracefully degrade — a RedisError is logged and None/False
    is returned rather than raising, because cache is non-fatal.
    """

    def __init__(self, redis_client: aioredis.Redis) -> None:
        self.redis = redis_client

    # ── Key builders ──────────────────────────────────────────────────────────

    @staticmethod
    def key_base_avatar(user_id: str) -> str:
        return f"glb:avatar:{user_id}"

    @staticmethod
    def key_template_dress(template_id: str, body_label: str) -> str:
        return f"glb:dress:template:{template_id}:{body_label}"

    @staticmethod
    def key_generated_dress(image_sha256: str) -> str:
        return f"glb:dress:generated:{image_sha256}"

    @staticmethod
    def key_result(*parts: str) -> str:
        # Backward-compatible signatures:
        # key_result(job_id) or key_result(user_id, job_id)
        if len(parts) == 1:
            return f"glb:result:{parts[0]}"
        if len(parts) == 2:
            return f"glb:result:{parts[0]}:{parts[1]}"
        raise TypeError("key_result expects (job_id) or (user_id, job_id)")

    @staticmethod
    def key_job_status(*parts: str) -> str:
        # Backward-compatible signatures:
        # key_job_status(job_id) or key_job_status(user_id, job_id)
        if len(parts) == 1:
            return f"job:status:{parts[0]}"
        if len(parts) == 2:
            return f"job:{parts[0]}:{parts[1]}"
        raise TypeError("key_job_status expects (job_id) or (user_id, job_id)")

    @staticmethod
    def key_rate_limit_user(user_id: str) -> str:
        return f"tripo:rate:{user_id}"

    @staticmethod
    def key_rate_limit_global() -> str:
        return "tripo:rate:global"

    @staticmethod
    def key_template_select(user_id: str, category: str) -> str:
        return f"template:select:{user_id}:{category}"

    # ── GLB bytes ─────────────────────────────────────────────────────────────

    async def get_glb(self, key: str) -> Optional[bytes]:
        try:
            return await self.redis.get(key)
        except RedisError as exc:
            logger.warning("cache.get_glb failed for key=%s: %s", key, exc)
            return None

    async def set_glb(
        self,
        key: str,
        data: bytes,
        ttl_seconds: int = 3600,
        ttl: Optional[int] = None,
    ) -> None:
        try:
            effective_ttl = ttl if ttl is not None else ttl_seconds
            await self.redis.set(key, data, ex=effective_ttl)
        except RedisError as exc:
            logger.warning("cache.set_glb failed for key=%s: %s", key, exc)

    async def delete(self, key: str) -> None:
        try:
            await self.redis.delete(key)
        except RedisError as exc:
            logger.warning("cache.delete failed for key=%s: %s", key, exc)

    async def delete_pattern(self, pattern: str) -> int:
        """
        Delete all keys matching *pattern*.
        Uses SCAN + pipeline DELETE (never KEYS — forbidden in production).
        Returns the count of deleted keys.
        """
        deleted = 0
        try:
            cursor = 0
            while True:
                cursor, keys = await self.redis.scan(cursor, match=pattern, count=100)
                if keys:
                    pipe = self.redis.pipeline()
                    for k in keys:
                        pipe.delete(k)
                    await pipe.execute()
                    deleted += len(keys)
                if cursor == 0:
                    break
        except RedisError as exc:
            logger.warning("cache.delete_pattern failed for pattern=%s: %s", pattern, exc)
        return deleted

    # ── Generic bytes ─────────────────────────────────────────────────────────

    async def get_bytes(self, key: str) -> Optional[bytes]:
        return await self.get_glb(key)

    # ── Job status ────────────────────────────────────────────────────────────

    async def set_job_status(self, job_id: str, payload: dict) -> None:
        try:
            await self.redis.setex(
                self.key_job_status(job_id),
                86_400,  # 24 h TTL
                json.dumps(payload),
            )
        except RedisError as exc:
            logger.warning("cache.set_job_status failed for job=%s: %s", job_id, exc)

    async def get_job_status(self, job_id: str) -> Optional[dict]:
        try:
            raw = await self.redis.get(self.key_job_status(job_id))
            return json.loads(raw) if raw else None
        except RedisError as exc:
            logger.warning("cache.get_job_status failed for job=%s: %s", job_id, exc)
            return None

    # ── Generic JSON ──────────────────────────────────────────────────────────

    async def set_json(self, key: str, payload: dict, ttl_seconds: int = 600) -> None:
        try:
            await self.redis.setex(key, ttl_seconds, json.dumps(payload))
        except RedisError as exc:
            logger.warning("cache.set_json failed for key=%s: %s", key, exc)

    async def get_json(self, key: str) -> Optional[dict]:
        try:
            raw = await self.redis.get(key)
            return json.loads(raw) if raw else None
        except RedisError as exc:
            logger.warning("cache.get_json failed for key=%s: %s", key, exc)
            return None

    # ── Rate limiting ─────────────────────────────────────────────────────────

    async def check_and_increment_rate(
        self,
        user_id: str,
        limit: int = 10,
        window_seconds: int = 3600,
    ) -> tuple[bool, int]:
        """
        Increment the per-user Tripo rate counter.
        Returns (allowed: bool, current_count: int).
        Uses INCR + EXPIRE in a pipeline for atomicity.
        """
        key = self.key_rate_limit_user(user_id)
        try:
            async with self.redis.pipeline() as pipe:
                pipe.incr(key)
                pipe.expire(key, window_seconds)
                results = await pipe.execute()
            count: int = int(results[0])
            allowed = count <= limit
            return allowed, count
        except Exception as exc:
            logger.warning("cache.check_and_increment_rate failed: %s", exc)
            # Fail open: allow the request if Redis is down
            return True, 0

    async def check_and_increment_global_rate(
        self, limit: int = 500, window_seconds: int = 3600
    ) -> tuple[bool, int]:
        """Increment and check the global Tripo rate counter."""
        key = self.key_rate_limit_global()
        try:
            async with self.redis.pipeline() as pipe:
                pipe.incr(key)
                pipe.expire(key, window_seconds)
                results = await pipe.execute()
            count: int = int(results[0])
            return count <= limit, count
        except Exception as exc:
            logger.warning("cache.check_and_increment_global_rate failed: %s", exc)
            return True, 0

    # ── Stats ─────────────────────────────────────────────────────────────────

    async def get_stats(self) -> dict:
        """Return Redis memory info and key counts by prefix for admin endpoint."""
        try:
            info = await self.redis.info("memory")
            prefixes = ["glb:base:", "glb:dress:", "glb:result:", "job:status:", "tripo:rate:"]
            counts: dict[str, int] = {}
            for prefix in prefixes:
                count = 0
                cursor = 0
                while True:
                    cursor, keys = await self.redis.scan(cursor, match=f"{prefix}*", count=200)
                    count += len(keys)
                    if cursor == 0:
                        break
                counts[prefix.rstrip(":")] = count
            return {
                "used_memory_human": info.get("used_memory_human"),
                "used_memory_peak_human": info.get("used_memory_peak_human"),
                "key_counts": counts,
            }
        except RedisError as exc:
            logger.warning("cache.get_stats failed: %s", exc)
            return {"error": str(exc)}
