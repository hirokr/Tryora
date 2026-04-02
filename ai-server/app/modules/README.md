# app/modules

## Responsibility

Contains all feature modules, each packaging its own API routes, schemas, domain logic, service layer, and Celery workers as a vertical slice. Modules are self-contained and communicate through shared infrastructure rather than direct cross-module imports.

## Files

| File | Description |
|---|---|
| `__init__.py` | Package marker. |

## Subdirectories

| Directory | Description |
|---|---|
| `consent/` | User consent management — tracks consent records for data collection (body measurements, location, preferences). |
| `dress_search/` | Dress search pipeline — LLM parsing of natural language prompts, Google Shopping search, product enrichment, and semantic caching. |
| `prebake/` | Pre-bake pipeline — pre-generates GLB dress variants for templates across body types to enable instant try-on. |
| `profiles/` | User profile management — CRUD for user profiles, body measurements, and preferences with consent gating. |
| `templates/` | Dress template management — browsing, selection, and caching of pre-built 3D dress templates. |
| `try_on/` | Virtual try-on orchestration — coordinates 3D model generation, GLB dressing, and job status tracking. |
| `uploads/` | File upload handling — dress image uploads, validation, and S3 storage. |
