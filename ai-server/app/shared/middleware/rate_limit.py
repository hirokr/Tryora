"""
rate_limit.py — Redis-backed per-user rate limiting middleware
--------------------------------------------------------------
Global middleware: 100 requests/minute per authenticated user.
Admin users and /health endpoint are exempt.

Tripo-specific rate limiting (per-user/global call counters) is handled
separately in `app/services/cache.py` → `check_and_increment_rate`.
"""
from __future__ import annotations

import time
from typing import Callable

import redis.asyncio as aioredis
from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

from app.core.logger import logger

_EXEMPT_PATHS = {"/health", "/api/v1/health", "/docs", "/redoc", "/openapi.json"}
_DEFAULT_LIMIT = 100
_DEFAULT_WINDOW = 60  # seconds


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Sliding-window rate limit on authenticated requests (Redis INCR + EXPIRE)."""

    def __init__(self, app: ASGIApp, redis_client: aioredis.Redis | None = None) -> None:
        super().__init__(app)
        self._redis: aioredis.Redis | None = redis_client

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Skip exempt paths
        if request.url.path in _EXEMPT_PATHS:
            return await call_next(request)

        # Only rate-limit if Redis is available
        redis_client: aioredis.Redis | None = self._redis or getattr(
            request.app.state, "redis", None
        )
        if redis_client is None:
            return await call_next(request)

        # Identify the caller — prefer JWT userId, fall back to IP
        user_key = _extract_user_key(request)
        if not user_key:
            return await call_next(request)

        # Check admin exemption from request state (populated by auth middleware if used)
        if getattr(request.state, "is_admin", False):
            return await call_next(request)

        key = f"ratelimit:{user_key}:{int(time.time()) // _DEFAULT_WINDOW}"

        try:
            pipe = redis_client.pipeline()
            pipe.incr(key)
            pipe.expire(key, _DEFAULT_WINDOW * 2)
            results = await pipe.execute()
            count: int = results[0]
        except Exception as exc:
            logger.warning("Rate limit Redis error (allowing request): %s", exc)
            return await call_next(request)

        if count > _DEFAULT_LIMIT:
            retry_after = _DEFAULT_WINDOW - (int(time.time()) % _DEFAULT_WINDOW)
            return JSONResponse(
                status_code=429,
                content={"detail": "Too many requests", "retry_after": retry_after},
                headers={"Retry-After": str(retry_after)},
            )

        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(_DEFAULT_LIMIT)
        response.headers["X-RateLimit-Remaining"] = str(max(0, _DEFAULT_LIMIT - count))
        return response


def _extract_user_key(request: Request) -> str | None:
    """
    Return the rate-limit bucket key for this request.
    Uses the JWT `sub`/`userId` claim if available, otherwise falls back to IP.
    """
    # Prefer a userId already decoded and stored on request.state by auth deps
    user_id = getattr(request.state, "user_id", None)
    if user_id:
        return f"uid:{user_id}"

    # Fallback: use client IP
    client = request.client
    if client:
        return f"ip:{client.host}"

    return None
