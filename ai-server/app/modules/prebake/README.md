# app/modules/prebake

## Responsibility

Manages the pre-bake pipeline that pre-generates GLB dress variants for template dresses across different body types. This enables instant try-on for popular templates by avoiding on-demand 3D generation latency. Workers process pre-bake requests and cache results in Redis and S3.

## Files

| File | Description |
|---|---|
| `__init__.py` | Package marker. |
| `service.py` | Business logic for initiating and tracking pre-bake jobs. |
| `workers.py` | Celery workers that generate GLB variants for template dresses across body labels using Tripo AI. |

## Subdirectories

None.
