# Tryora FastAPI Server — Project Context

## What This Server Does
This is the AI & Scraping Engine for Tryora, an AI-powered 3D virtual try-on
and scene generation platform. It handles ALL GPU-intensive and AI tasks.
It is NOT user-facing — Express.js is the only caller of this server.

## Architecture Position
- Express.js (Node.js) is the API Gateway. It places job tickets in Redis.
- This FastAPI server picks up jobs from Redis via Celery workers.
- Workers process AI tasks (avatar generation, VTON, dress search).
- Results (GLB files, VTON images) are saved to Cloudflare R2.
- Job status is updated in PostgreSQL (Supabase).
- Final result URLs are stored in the ai_jobs table for Express to poll.

## Tech Stack
- Python 3.11, FastAPI, Uvicorn
- Celery 5.x with Redis as the message broker
- Prisma Python client for PostgreSQL (shared schema with Express)
- OOTDiffusion (Apache 2.0) for VTON — self-hosted on HF ZeroGPU
- HMR 2.0 + smplx library for body reconstruction
- boto3 for Cloudflare R2 (S3-compatible API)
- Anthropic Python SDK (claude-sonnet-4-6) for LLM context extraction only
- Serper API for Google Search scraping

## Celery Job Types
Three job types, each a separate Celery task:

1. AVATAR_GENERATION
   - Input: {jobId, userId, frontPhotoUrl, sidePhotoUrl, backPhotoUrl}
   - Process: Download photos → HMR2.0 body estimation → SMPL-X mesh →
     texture mapping → export GLB → upload to R2
   - Output: Update ai_jobs with status=COMPLETED and result_url (R2 GLB URL)

2. TRY_ON_SCENE
   - Input: {jobId, userId, avatarGlbUrl, dressImageUrl, scenePrompt}
   - Process: Render avatar to 2D pose image → OOTDiffusion VTON →
     Stable Diffusion background generation → composite → upload to R2
   - Output: Update ai_jobs with status=COMPLETED and result_url (composite image)

3. DRESS_SEARCH
   - Input: {jobId, userId, prompt}
   - Process: Anthropic LLM extracts JSON search params → Serper API Google
     search → parse dress data → upsert into PostgreSQL dresses table
   - Output: Update ai_jobs with status=COMPLETED, dresses stored in DB

## Folder Structure (enforce strictly)