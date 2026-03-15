import redis.asyncio as aioredis

from app.config.settings import settings


def get_redis_client(*, decode_responses: bool = False) -> aioredis.Redis:
    return aioredis.from_url(settings.REDIS_URL, decode_responses=decode_responses)