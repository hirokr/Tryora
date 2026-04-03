#!/usr/bin/env python3
"""
scripts/warm_cache.py — pre-load top N active template GLBs from S3 into Redis
-------------------------------------------------------------------------------
Reads the top N active DressTemplates ordered by category+bodyLabel,
downloads each GLB from S3 (if glbSource starts with "s3:"),
and stores them in Redis with a 1-hour TTL.

Usage:
    python -m scripts.warm_cache          # warms top 27 templates
    WARM_N=10 python -m scripts.warm_cache
"""
from __future__ import annotations

import asyncio
import logging
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.config.logging import logger

logging.basicConfig(level=logging.INFO)

TOP_N = int(os.getenv("WARM_N", "27"))


async def warm() -> None:
    from prisma import Prisma
    import redis.asyncio as aioredis
    from app.config.settings import settings
    from app.infrastructure.cache.cache_service import CacheService
    from app.infrastructure.storage.s3 import s3_service

    db = Prisma(auto_register=True)
    await db.connect()

    redis_client = aioredis.from_url(settings.REDIS_URL, decode_responses=False)
    cache = CacheService(redis_client)

    templates = await db.dresstemplate.find_many(
        where={"isActive": True, "glbSource": {"not": None}},
        take=TOP_N,
        order=[{"category": "asc"}, {"bodyLabel": "asc"}],
    )

    logger.info("Warming cache for %d templates…", len(templates))
    hit = 0
    miss = 0

    for tmpl in templates:
        body_label = tmpl.bodyLabel or "universal"
        cache_key = cache.key_template_dress(tmpl.id, body_label)

        # Skip if already cached
        existing = await cache.get_glb(cache_key)
        if existing:
            logger.info("  ✓ Already cached: %s (%s)", tmpl.id, body_label)
            hit += 1
            continue

        # Download from S3
        glb_source = tmpl.glbSource
        if not glb_source or not glb_source.startswith("s3:"):
            logger.warning("  ✗ No S3 source for template %s — skip", tmpl.id)
            miss += 1
            continue

        # Parse "s3:{bucket}/{key}"
        _, rest = glb_source.split(":", 1)
        parts = rest.split("/", 1)
        if len(parts) != 2:
            logger.warning("  ✗ Malformed glbSource '%s' — skip", glb_source)
            miss += 1
            continue

        s3_key = parts[1]
        try:
            glb_bytes = await s3_service.download_bytes(s3_key)
        except Exception as exc:
            logger.warning("  ✗ S3 download failed for %s: %s", s3_key, exc)
            miss += 1
            continue

        if glb_bytes:
            await cache.set_glb(cache_key, glb_bytes, ttl=3600)
            logger.info("  ✓ Warmed: %s → %d bytes", tmpl.id, len(glb_bytes))
            hit += 1
        else:
            logger.warning("  ✗ Empty GLB for template %s", tmpl.id)
            miss += 1

    logger.info("Cache warm complete: %d loaded, %d skipped/failed.", hit, miss)
    await redis_client.aclose()
    await db.disconnect()


if __name__ == "__main__":
    asyncio.run(warm())
