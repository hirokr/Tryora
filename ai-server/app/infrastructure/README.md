# app/infrastructure

## Responsibility

Provides concrete implementations for all external systems the application depends on — databases, caches, message queues, object storage, vector stores, and third-party APIs. Each subdirectory hides vendor-specific details behind clean interfaces consumed by services and modules.

## Files

| File | Description |
|---|---|
| `__init__.py` | Package marker. |

## Subdirectories

| Directory | Description |
|---|---|
| `cache/` | Redis-backed async cache service for GLB bytes, job statuses, and rate-limit counters. |
| `db/` | Database connection setup and repository layer for Prisma ORM queries. |
| `external/` | Async HTTP clients for third-party APIs (OpenRouter, ScraperAPI, Serper, Tripo AI, xAI). |
| `queue/` | Celery application configuration and event constants for async task processing. |
| `storage/` | S3 object storage service, local disk storage, and a GLB source URI dispatcher. |
| `vectorstore/` | ChromaDB vector store wrapper for embedding-based caching of dress searches. |
