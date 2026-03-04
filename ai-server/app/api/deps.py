from typing import AsyncGenerator
from prisma import Prisma
from app.db.prisma_connect import db


async def get_db() -> AsyncGenerator[Prisma, None]:
    """FastAPI dependency that yields the shared Prisma client.

    Usage::

        @router.get("/example")
        async def example(db: Prisma = Depends(get_db)):
            return await db.user.find_many()
    """
    yield db
