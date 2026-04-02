# app/modules/consent

## Responsibility

Manages user consent records for data collection categories (body measurements, location, preferences, ethnicity). Provides consent granting/revocation, consent verification for gated operations, and audit trails for GDPR compliance.

## Files

| File | Description |
|---|---|
| `__init__.py` | Package marker. |
| `api.py` | FastAPI router — endpoints for granting/revoking consent and checking consent status. |
| `domain.py` | Domain models for consent types, consent records, and consent validation rules. |
| `schemas.py` | Pydantic models for consent request/response payloads. |
| `service.py` | Business logic for consent lifecycle management, integrated with the consent record repository. |

## Subdirectories

None.
