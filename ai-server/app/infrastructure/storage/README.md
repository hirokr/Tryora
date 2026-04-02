# app/infrastructure/storage

## Responsibility

Manages persistent blob storage for GLB 3D models, dress images, and try-on results. Provides an S3 service as the primary L2 storage tier, a local disk storage for offline development, and a GLB source URI dispatcher that resolves `redis:`, `s3:`, `local:`, and `url:` schemes to bytes.

## Files

| File | Description |
|---|---|
| `__init__.py` | Package marker. |
| `glb_loader.py` | `load_glb()` — dispatches GLB loading based on source URI scheme (Redis cache, S3, local disk, or HTTP URL); `GlbSource` enum. |
| `local_storage.py` | `LocalStorage` — simple path resolver for local disk storage (offline mode only). |
| `s3.py` | `S3Service` — async S3 operations via boto3 wrapped in `asyncio.to_thread`: upload, download, presigned URL generation, single-object delete, prefix purge (GDPR erasure), and S3 key builders for avatars, uploads, catalog variants, and try-on results. |

## Subdirectories

None.
