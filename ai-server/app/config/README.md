# app/config/

Settings and logging — single source of truth for environment variables and log configuration.

## Responsibility

Centralizes all runtime configuration. No other module should read environment variables directly; they should import `settings` from here.

## Files

| File | Description |
|---|---|
| `settings.py` | Pydantic `Settings` class. Reads env vars via `pydantic-settings`. All fields have defaults for degraded-mode startup. Feature flags (`ENABLE_LEGACY_ROUTES`, etc.) live here. |
| `logging.py` | Logging configuration. Sets log level from `settings.LOG_LEVEL`. Exports the shared `logger` and `configure_logging()`. |
| `constants.py` | Hardcoded constants that don't vary by environment (e.g., enum values, fixed thresholds). |
| `__init__.py` | Package marker. |

## Usage

```python
from app.config.settings import settings
from app.config.logging import logger

# Access any env var
api_key = settings.MASTER_APIKEY
db_url = settings.DATABASE_URL
```
