# Tryora FastAPI Server — CLAUDE.md

## Project Purpose
AI-powered 3D virtual try-on and scene generation platform. This FastAPI server is
the AI & Scraping Engine. It handles GPU-intensive tasks, communicates with Express.js
as the API gateway, and processes background jobs via Celery workers backed by Redis.

## Architecture Role
- This server is NOT user-facing. Express.js is the only caller.
- Receives job tickets from Redis (placed by Express), processes them, updates PostgreSQL.
- Pushes final assets (GLB files, VTON images) to Cloudflare R2 (S3-compatible).

## Tech Stack
- Python 3.11, FastAPI, Uvicorn
- Celery 5.x with Redis as broker
- ORM: Prisma Python client (schema lives in Express project, shared)
- VTON model: OOTDiffusion (Apache 2.0) — self-hosted
- Body reconstruction: HMR 2.0 + smplx Python library
- Storage: Cloudflare R2 via boto3 (S3-compatible)
- LLM calls: Anthropic SDK (claude-sonnet-4-6) for context extraction only

## Job Types (Celery tasks)
- AVATAR_GENERATION: HMR2.0 → SMPL-X mesh → texture → GLB → R2
- TRY_ON_SCENE: OOTDiffusion VTON + Stable Diffusion background → composite image → R2
- DRESS_SEARCH: Serper API scrape → LLM JSON extraction → PostgreSQL upsert

## Folder Structure
app/
  main.py          # FastAPI app, health endpoints only
  routers/         # Route handlers — one file per job type
  tasks/           # Celery task definitions
  models/          # Pydantic schemas for job payloads
  services/        # Business logic (avatar, vton, scraping, storage)
  core/            # Config, Redis connection, R2 client, DB client

## Conventions
- All endpoints return {jobId, status} immediately — no blocking AI calls in routes
- Celery tasks update ai_jobs table status: PENDING → PROCESSING → COMPLETED/FAILED
- All R2 uploads use presigned URLs, never public buckets
- Environment variables only — never hardcode keys
- Write tests for every service function using pytest