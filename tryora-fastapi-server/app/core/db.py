from contextlib import asynccontextmanager

try:
    from prisma import Prisma
except ImportError:  # pragma: no cover
    Prisma = None


_client = None


def get_prisma_client():
    global _client
    if Prisma is None:
        raise RuntimeError("Prisma client is not installed")
    if _client is None:
        _client = Prisma()
    return _client


@asynccontextmanager
async def prisma_session():
    client = get_prisma_client()
    await client.connect()
    try:
        yield client
    finally:
        await client.disconnect()
