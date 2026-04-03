# app/shared/security

## Responsibility

Provides authentication and authorization primitives used across all feature modules: JWT token validation compatible with the Tryora Express backend, API key verification for server-to-server communication, and role-based permission checks.

## Files

| File | Description |
|---|---|
| `__init__.py` | Package marker. |
| `api_key.py` | `checkApiKey()` FastAPI dependency — validates `X-API-Key` header against known server keys and a configurable master key; returns the server name on success. |
| `jwt.py` | JWT authentication — `get_current_user()` validates Bearer tokens issued by the Express backend and returns a `TokenPayload`; `get_current_admin()` requires admin role; handles expired signatures and malformed tokens with appropriate HTTP errors. |
| `permissions.py` | Re-exports `require_admin` (alias for `get_current_admin`) for convenient import in route handlers. |

## Subdirectories

None.
