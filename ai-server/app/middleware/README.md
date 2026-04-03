# app/middleware

## Responsibility

Provides Starlette/FastAPI middleware components for cross-cutting concerns such as request logging, audit trails, security headers, and performance monitoring. Middleware runs on every request/response cycle.

## Files

| File | Description |
|---|---|
| `__init__.py` | Package marker. |
| `audit_log.py` | `AuditLogMiddleware` — logs HTTP method, path, status code, and request processing time for every request. |

## Subdirectories

None.
