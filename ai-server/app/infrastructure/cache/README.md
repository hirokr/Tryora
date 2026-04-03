# app/infrastructure/cache

## Responsibility

Provides an async Redis-backed cache service used as the L1 cache tier for GLB 3D model bytes, job status JSON, rate-limit counters, and template selection results. All methods gracefully degrade on Redis errors since cache misses are non-fatal.

## Files

| File | Description |
|---|---|
| `__init__.py` | Package marker. |
| `cache_service.py` | `CacheService` class — async Redis operations for GLB bytes, job status, rate limiting, generic JSON, pattern-based deletion, and cache stats. |
| `keys.py` | Standalone key-builder helpers that delegate to `CacheService` static methods for avatar and template dress cache keys. |
| `redis.py` | Factory function `get_redis_client()` that creates an async Redis client from `settings.REDIS_URL`. |

## Subdirectories

None.
