# app/infrastructure/queue

## Responsibility

Configures the Celery application for async task processing and defines event constants used across the system. Redis serves as both the broker and result backend, shared with the caching layer.

## Files

| File | Description |
|---|---|
| `__init__.py` | Package marker. |
| `celery_app.py` | Singleton `celery_app` — Celery configuration with JSON serialization, UTC timezone, late acks, result expiry (24h), rate limits, and task module includes for dress_search, try_on, and prebake workers. |
| `events.py` | Event name constants: `TRY_ON_REQUESTED`, `PREBAKE_REQUESTED`, `DRESS_SEARCH_REQUESTED`. |

## Subdirectories

None.
