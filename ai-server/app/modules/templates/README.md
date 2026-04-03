# app/modules/templates

## Responsibility

Manages 3D dress templates — pre-built GLB models for common dress styles across body types and ethnicities. Provides browsing, filtering, selection, and caching of template dresses. Templates enable instant try-on without waiting for on-demand 3D generation.

## Files

| File | Description |
|---|---|
| `__init__.py` | Package marker. |
| `api.py` | FastAPI router — endpoints for listing templates, fetching template details, and selecting templates for try-on. |
| `schemas.py` | Pydantic models for template request/response payloads. |
| `selector.py` | Template selection logic — matches user body type, preferences, and category to the best template variant. |
| `service.py` | Business logic layer for template operations, including cache-aware template retrieval. |

## Subdirectories

None.
