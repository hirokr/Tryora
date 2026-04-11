"""
glb_loader.py — GLB Source Dispatcher
---------------------------------------
Resolves a source URI and returns the GLB bytes.

Supported source URI schemes:
  redis:{key}           → load from Redis L1 cache
  s3:{bucket}/{key}     → load from S3 L2 cache
  local:{/abs/path}     → load from local disk (OFFLINE_MODE only)
  url:{https://...}     → streaming download (Tripo CDN output)
"""
from __future__ import annotations

import asyncio
import logging
from enum import Enum
from typing import TYPE_CHECKING

import httpx
from fastapi import HTTPException, status

from app.config.settings import settings

if TYPE_CHECKING:
    from app.infrastructure.cache.cache_service import CacheService
    from app.infrastructure.storage.s3 import S3Service

logger = logging.getLogger("api_security")


class GlbSource(str, Enum):
    REDIS = "redis"
    S3 = "s3"
    LOCAL = "local"
    URL = "url"


async def load_glb(
    source_uri: str,
    cache: "CacheService",
    s3: "S3Service | None" = None,
) -> bytes:
    """
    Load a GLB from the specified source URI.

    source_uri examples:
        "redis:glb:base:user_abc"
        "s3:tryora-assets/avatars/user_abc/base.glb"
        "local:/data/glb/template_maxi_average.glb"
        "url:https://cdn.tripo3d.ai/output/xyz.glb"
    """
    if ":" not in source_uri:
        raise ValueError(f"Invalid GLB source URI (missing scheme): {source_uri!r}")

    scheme, path = source_uri.split(":", 1)

    try:
        source = GlbSource(scheme.lower())
    except ValueError:
        raise ValueError(f"Unknown GLB source scheme: {scheme!r}")

    if source == GlbSource.REDIS:
        data = await cache.get_bytes(path)
        if data is None:
            raise FileNotFoundError(f"GLB not found in Redis: {path}")
        return data

    if source == GlbSource.S3:
        if s3 is None:
            from app.infrastructure.storage.s3 import s3_service as _s3
            s3 = _s3
        # path format: bucket/key
        bucket, key = path.split("/", 1)
        return await s3.download_bytes(key, bucket=bucket)

    if source == GlbSource.LOCAL:
        if not settings.OFFLINE_MODE:
            raise HTTPException(
                status_code=status.HTTP_501_NOT_IMPLEMENTED,
                detail="Local GLB loading is only available in OFFLINE_MODE",
            )
        abs_path = path
        def _read() -> bytes:
            with open(abs_path, "rb") as f:
                return f.read()
        try:
            return await asyncio.to_thread(_read)
        except FileNotFoundError:
            raise FileNotFoundError(f"Local GLB not found: {abs_path}")

    if source == GlbSource.URL:
        return await _stream_url(path)

    raise ValueError(f"Unhandled GLB source: {source}")


async def _stream_url(url: str) -> bytes:
    """Stream-download a GLB from a URL without loading the entire file at once."""
    chunks: list[bytes] = []
    async with httpx.AsyncClient(timeout=120) as client:
        async with client.stream("GET", url) as response:
            response.raise_for_status()
            async for chunk in response.aiter_bytes(chunk_size=64 * 1024):
                chunks.append(chunk)
    return b"".join(chunks)
