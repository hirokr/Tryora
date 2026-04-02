# app/infrastructure/db

## Responsibility

Manages the database layer for the application, including Prisma ORM connection setup and the repository pattern for data access. Repositories encapsulate all queries against Postgres tables (DressSearch, GenerationJob, DressTemplate, UserProfile, ConsentRecord).

## Files

| File | Description |
|---|---|
| `__init__.py` | Package marker. |

## Subdirectories

| Directory | Description |
|---|---|
| `repositories/` | Repository modules with typed async query functions for each domain entity. |
