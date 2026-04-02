# ai-server — Tryora AI Backend

FastAPI backend for the Tryora platform: dress search, 3D try-on, profile management, and template catalog.

## Quick Start

```bash
cd ai-server
uv sync
uv run prisma generate --schema prisma/schema.prisma
uv run uvicorn app.main:app --reload --port 8888
```

## Architecture

### Canonical Layout

```
app/
├── main.py                  # FastAPI entrypoint (create_app factory)
├── api/                     # Router composition only
│   ├── router.py            # Aggregates all feature routers
│   ├── admin.py             # Admin endpoints
│   ├── health.py            # Health check
│   └── deps.py              # FastAPI dependencies (get_db)
├── modules/                 # Feature modules (canonical)
│   ├── dress_search/        # Dress search API + workers
│   ├── try_on/              # 3D try-on API, service, workers
│   ├── profiles/            # Profile + consent + GDPR
│   ├── templates/           # Template catalog + GLB delivery
│   ├── uploads/             # Dress image uploads
│   ├── consent/             # Consent domain logic
│   └── prebake/             # Pre-bake template GLBs
├── infrastructure/          # Platform layer
│   ├── cache/               # Redis cache service
│   ├── db/                  # Prisma client + repositories
│   ├── external/            # Tripo, Serper, ScraperAPI, xAI
│   ├── queue/               # Celery app config
│   ├── storage/             # S3 service + GLB loader
│   └── vectorstore/         # ChromaDB
├── config/                  # Settings + logging (canonical)
│   ├── settings.py          # Single source of truth for env vars
│   └── logging.py           # Logging configuration
├── schemas/                 # Shared Pydantic models
├── models/                  # Compatibility re-exports → modules
├── services/                # Compatibility re-exports → modules
├── middleware/              # Compatibility re-exports → modules
└── domains/                 # Compatibility re-exports → modules
```

### Legacy Compatibility

Old import paths still work via re-export shims:
- `app.core.config` → `app.config.settings`
- `app.core.logger` → `app.config.logging`
- `app.services.*` → `app.modules.*` or `app.infrastructure.*`
- `app.api.try_on` → `app.modules.try_on.api`
- `app.api.profile` → `app.modules.profiles.api`
- `app.domains.dresses.router` → `app.modules.dress_search.api`
- `app.worker.celery_app` → `app.infrastructure.queue.celery_app`
- `app.worker.dress_tasks` → `app.modules.dress_search.workers`
- `app.middleware.secure_keys` → `app.shared.security.api_key`

## Environment Variables

See `.env.example` for all required variables. Key variables:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `MASTER_APIKEY` | Server-to-server API key |
| `JWT_SECRET` | Shared JWT secret with Express backend |
| `SERPER_APIKEY` | Serper.dev API key |
| `TRIPO_API_KEY` | Tripo AI API key |
| `SCRAPER_API_KEY` | ScraperAPI key |
| `S3_BUCKET` | AWS S3 bucket name |
| `AWS_ACCESS_KEY_ID` | AWS credentials |
| `AWS_SECRET_ACCESS_KEY` | AWS credentials |
| `OFFLINE_MODE` | Disable external API calls (dev) |

## Running

```bash
# API server
uv run uvicorn app.main:app --reload --port 8888

# Celery worker
uv run celery -A app.infrastructure.queue.celery_app worker -l INFO

# Prisma
uv run prisma generate --schema prisma/schema.prisma
uv run prisma migrate dev --schema prisma/schema.prisma
```

## Testing

```bash
# All tests
uv run pytest

# Unit tests only
uv run pytest tests/unit

# Integration tests only
uv run pytest tests/integration

# With coverage
uv run pytest --cov=app --cov-report=term-missing
```

## Docker

```bash
docker build -t tryora-ai-server .
docker run -p 8888:8888 tryora-ai-server
```

## Migration Notes

This codebase was refactored from a mixed legacy/new structure into a canonical `app/modules/*` layout. Legacy import paths are preserved via compatibility shims for backward compatibility. See `MIGRATION.md` for details.
