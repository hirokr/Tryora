# app/modules/profiles

## Responsibility

Manages user profiles including body measurements, preferences, gender, ethnicity, and location. Enforces consent gating — profile fields are only accessible when the user has granted the corresponding consent type. Provides CRUD operations with ownership checks.

## Files

| File | Description |
|---|---|
| `__init__.py` | Package marker. |
| `api.py` | FastAPI router — endpoints for profile CRUD, measurement updates, and preference management with consent verification. |
| `domain.py` | Domain models and business rules for UserProfile entities. |
| `policies.py` | Authorization policies that gate profile access based on consent records. |
| `schemas.py` | Pydantic models for profile request/response payloads. |
| `service.py` | Business logic layer for profile operations, delegating to repositories and consent checks. |

## Subdirectories

None.
