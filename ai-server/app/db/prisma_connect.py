import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from prisma import Prisma
from app.core.config import settings
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
    try:
        yield
    finally:
        if db.is_connected():
            await db.disconnect()
            logger.info("Database disconnected.")