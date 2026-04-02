# app/shared

## Responsibility

Provides cross-cutting primitives used by all feature modules: custom exception types, standardized response helpers, security utilities (JWT auth, API key validation, permissions), and generic helper functions. Code here must not depend on any feature-specific package.

## Files

| File | Description |
|---|---|
| `__init__.py` | Package marker. |
| `exceptions.py` | Custom exception hierarchy: `AppError` (base), `NotFoundError`, `PermissionDeniedError`. |
| `responses.py` | `ok_response()` helper that returns a standardized `{"status": "ok", "message": ..., "data": ...}` dict. |

## Subdirectories

| Directory | Description |
|---|---|
| `security/` | Authentication and authorization utilities — JWT validation, API key checking, and role-based permissions. |
| `utils/` | Generic utility functions shared across modules. |
