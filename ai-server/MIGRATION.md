# Migration Guide — ai-server Refactor

## What Changed

The ai-server codebase was refactored from a mixed legacy/new structure into a canonical layout centered on `app/modules/*` for features and `app/infrastructure/*` for platform services.

### Key Changes

| Before | After | Notes |
|---|---|---|
| `app.core.config` | `app.config.settings` | Single source of truth for settings |
| `app.core.logger` | `app.config.logging` | Logging now reads LOG_LEVEL from settings |
| `app.api/*` (route implementations) | `app/modules/*/api.py` | Only router composition remains in `app/api/` |
| `app.domains.dresses.router` | `app.modules.dress_search.api` | Dress search moved to canonical module |
| `app.worker/celery_app.py` | `app.infrastructure.queue.celery_app` | Canonical Celery config |
| `app.worker/dress_tasks.py` | `app.modules.dress_search.workers` | Dress search worker |
| `app.workers/try_on_task` | `app.modules.try_on.workers` | Try-on worker |
| `app.workers/prebake_task` | `app.modules.prebake.workers` | Prebake worker |
| `app.services/*` | `app.modules/*` or `app.infrastructure/*` | Compatibility re-exports only |
| `app.middleware.secure_keys` | `app.shared.security.api_key` | API key auth moved to shared |
| `app.db.prisma_connect` | Still valid | Prisma client unchanged; now initializes Redis cache in lifespan |

### Breaking Changes

- **`create_job()` signature changed**: Now takes `user_id`, `db`, `template_dress_id`, `user_image_s3_key`, `cache` instead of `user_id`, `job_type`, `db`, `input_s3_key`
- **`update_job_status()` signature changed**: Now takes `job_id`, `status`, `db`, `cache`, `extra` instead of positional `job_id`, `status`, `progress`, `stage`, `db`, `cache`
- **`get_job()` return shape**: Now returns a dict with `id`, `status`, `progress`, `currentStage`, `errorMessage`, `resultS3Key`, `error`, `createdAt`, `completedAt`
- **`generate_presigned_url()`**: Now takes positional `key` argument instead of `object_key`
- **`key_try_on_result()`**: Now takes `(user_id, job_id)` instead of just `job_id`
- **Celery task module paths**: Updated from `app.worker.dress_tasks` to `app.modules.dress_search.workers`

### Backward Compatibility

Legacy import paths are preserved via re-export shims in:
- `app/core/config.py` → re-exports from `app/config/settings.py`
- `app/core/logger.py` → re-exports from `app/config/logging.py`
- `app/services/*.py` → re-exports from canonical modules/infrastructure
- `app/api/try_on.py`, `app/api/profile.py`, etc. → re-exports from `app/modules/*/api.py`
- `app/domains/dresses/router.py` → re-exports from `app/modules/dress_search/api.py`
- `app/worker/celery_app.py` → re-exports from `app/infrastructure/queue/celery_app.py`
- `app/middleware/secure_keys.py` → re-exports from `app/shared/security/api_key.py`

These shims will be removed in a future release. Migrate your imports to the canonical paths.

## New Prisma Models

Added to `prisma/schema.prisma`:
- `UserProfile` — user body measurements, consent state
- `DressTemplate` — pre-baked 3D dress templates
- `GenerationJob` — try-on and generation job tracking
- `ConsentRecord` — GDPR consent audit trail

Run `uv run prisma migrate dev --schema prisma/schema.prisma` to apply.

## New Config Fields

| Variable | Default | Description |
|---|---|---|
| `ENABLE_LEGACY_ROUTES` | `true` | Enable legacy route compatibility |
| `ENABLE_LEGACY_IMPORT_SHIMS` | `true` | Enable legacy import path compatibility |
| `ENABLE_TRY_ON_V2_SERVICE` | `true` | Use new try-on service contracts |
| `STRICT_CONFIG_VALIDATION` | `false` | Fail on missing optional env vars |

## Developer Workflow

```bash
# Install dependencies
uv sync

# Generate Prisma client
uv run prisma generate --schema prisma/schema.prisma

# Run migrations
uv run prisma migrate dev --schema prisma/schema.prisma

# Start API
uv run uvicorn app.main:app --reload --port 8888

# Start Celery worker
uv run celery -A app.infrastructure.queue.celery_app worker -l INFO

# Run tests
uv run pytest

# Run tests with coverage
uv run pytest --cov=app --cov-report=term-missing
```

## Rollback

If you need to rollback:
1. Revert to the pre-refactor git commit
2. Re-run `uv run prisma migrate dev --schema prisma/schema.prisma` if new models were applied
3. The new Prisma models (`UserProfile`, `DressTemplate`, `GenerationJob`, `ConsentRecord`) are additive and safe to keep
