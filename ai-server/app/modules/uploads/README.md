# app/modules/uploads

## Responsibility

Handles file uploads for dress images — validates uploaded images, stores them in S3 with content-addressed keys (SHA-256), and provides presigned URLs for client-side uploads. Supports the pipeline where user-uploaded dress images are converted to 3D models.

## Files

| File | Description |
|---|---|
| `__init__.py` | Package marker. |
| `api.py` | FastAPI router — endpoints for initiating uploads, receiving presigned URLs, and confirming upload completion. |
| `schemas.py` | Pydantic models for upload request/response payloads. |
| `service.py` | Business logic for upload validation, S3 key generation, and upload lifecycle management. |

## Subdirectories

None.
