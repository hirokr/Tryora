# app/

Application root. Contains the FastAPI entrypoint and top-level package structure.

## Responsibility

Bootstraps the FastAPI application, wires all routers, and defines the package namespace.

## Files

| File | Description |
|---|---|
| `main.py` | FastAPI app factory (`create_app()`). Wires middleware, routers, and root endpoints. |
| `__init__.py` | Package marker. |

## Subdirectories

| Directory | Responsibility |
|---|---|
| `api/` | Router composition — aggregates all feature routers into a single tree. |
| `config/` | Settings and logging — single source of truth for env vars and log config. |
| `db/` | Database layer — Prisma client connection, lifespan, and vector DB helpers. |
| `infrastructure/` | Platform services — cache, storage, external APIs, queue, vector store, DB repositories. |
| `middleware/` | HTTP middleware — audit logging, request ID, rate limiting. |
| `modules/` | Feature modules — dress search, try-on, profiles, templates, uploads, consent, prebake. |
| `schemas/` | Shared Pydantic models used across multiple modules. |
| `shared/` | Cross-cutting utilities — security (API key, JWT), exceptions, response helpers. |
