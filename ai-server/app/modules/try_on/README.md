# app/modules/try_on

## Responsibility

Orchestrates the virtual try-on pipeline: accepts a user's avatar and a dress (template or generated), coordinates 3D model generation via Tripo AI, manages GLB dressing operations, and tracks job status through completion. Supports both pre-baked template dresses and on-demand generated dresses.

## Files

| File | Description |
|---|---|
| `__init__.py` | Package marker. |
| `api.py` | FastAPI router for try-on endpoints — initiates try-on jobs, checks status, and retrieves results. |
| `body_classifier.py` | Body type classification logic for matching avatars to appropriate dress variants. |
| `orchestration.py` | Coordinates the multi-step try-on workflow: avatar loading, dress selection, 3D generation, and result assembly. |
| `schemas.py` | Pydantic models for try-on request/response payloads and job status. |
| `service.py` | Business logic layer for try-on operations. |
| `workers.py` | Celery workers for async try-on processing (Tripo AI task submission, polling, GLB composition). |

## Subdirectories

None.
