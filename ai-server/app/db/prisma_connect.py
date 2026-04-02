import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from prisma import Prisma

from app.config.settings import settings
from app.infrastructure.cache.cache_service import CacheService
from app.infrastructure.cache.redis import get_redis_client
from app.core.logger import logger

# Ensure DATABASE_URL is visible to the Prisma client at import time
os.environ.setdefault("DATABASE_URL", settings.DATABASE_URL)

# Single global Prisma client instance (connection-pool aware)
db = Prisma(auto_register=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Connect to the database on startup and disconnect on shutdown."""
    logger.info("Connecting to the database...")
    await db.connect()
    logger.info("Database connected.")

    redis_client = None
    try:
        redis_client = get_redis_client(decode_responses=False)
        app.state.redis = redis_client
        app.state.cache = CacheService(redis_client)
    except Exception as exc:
        logger.warning("Redis startup failed; continuing in degraded mode: %s", exc)

    try:
        yield
    finally:
        redis_client = getattr(app.state, "redis", None)
        if redis_client is not None:
            await redis_client.aclose()
        if db.is_connected():
            await db.disconnect()
            logger.info("Database disconnected.")
