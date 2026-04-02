# app/infrastructure/db/repositories

## Responsibility

Contains repository modules that encapsulate all Prisma ORM queries for the application's domain entities. Each repository provides async functions for CRUD operations with ownership checks to prevent enumeration attacks.

## Files

| File | Description |
|---|---|
| `__init__.py` | Package marker. |
| `dress_search_repo.py` | Placeholder for DressSearch queries (normalized backend layout). |
| `generation_job_repo.py` | Queries for `GenerationJob` — `get_job_by_id()` with ownership check, `list_user_jobs()` for recent history. |
| `template_repo.py` | Queries for `DressTemplate` — paginated `list_templates()` with category/body_label/ethnicity filters, `get_template_by_id()`. |
| `user_profile_repo.py` | Queries for `UserProfile` — `get_profile()`, `upsert_profile()`, and `check_consent()` for consent record verification. |

## Subdirectories

None.
