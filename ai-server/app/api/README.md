# app/api/

Router composition layer — aggregates all feature routers into a single routing tree.

## Responsibility

This directory contains **only** router composition and shared FastAPI dependencies. No business logic lives here.

## Files

| File | Description |
|---|---|
| `router.py` | Root router. Includes health, profile, templates, try-on, uploads, admin, and internal dress-search routers. All routes are mounted under their respective prefixes. |
| `admin.py` | Admin endpoints for template management (prebake triggers, admin-only template creation). |
| `health.py` | Simple health check endpoint (`GET /api/v1/health`). |
| `deps.py` | Shared FastAPI dependencies — currently `get_db` for Prisma client injection. |
| `__init__.py` | Package marker. |

## Convention

- Each file exports a `router` variable (FastAPI `APIRouter` instance).
- `router.py` is the single aggregation point — imported by `app/main.py`.
- Feature routers live in `app/modules/*/api.py`, not here.
