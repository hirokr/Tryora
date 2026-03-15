# Deployment Guide

## Overview

This project is split across two free-tier services:

- Railway runs the FastAPI API and Celery worker (CPU only).
- Hugging Face Spaces (ZeroGPU) runs OOTDiffusion inference.

Set `HF_SPACE_URL` on Railway so VTON inference is offloaded to the HF Space.

## 1. Deploy FastAPI on Railway

1. Push this repository to GitHub.
2. In Railway, create a new project from the GitHub repo.
3. Railway will detect `railway.toml` and use:
   - Build command: `pip install -r requirements.txt`
   - Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Add environment variables (see "Environment Variables" below).
5. Deploy and verify `/health` endpoint.

## 2. Deploy OOTDiffusion on Hugging Face Spaces

1. Create a new Hugging Face Space with SDK set to Gradio.
2. Push this same project (or a branch containing root `app.py`) to the Space.
3. Ensure the Space is configured for ZeroGPU.
4. After deployment, copy the Space URL (for example: `https://<user>-<space>.hf.space`).
5. Set Railway env var `HF_SPACE_URL` to that URL and redeploy Railway services.

## 3. Run Celery Worker as a Railway Service

1. In Railway, create a second service from the same repo.
2. Set the start command to:
   `celery -A app.core.celery_app worker --loglevel=info --concurrency=1`
3. Use the same shared environment variables as the web service.
4. Confirm worker logs show successful broker connection.

## Environment Variables

### Required for Railway web + worker

- `APP_ENV`
- `APP_HOST`
- `APP_PORT`
- `REDIS_URL`
- `PRISMA_DATABASE_URL`
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- `R2_PUBLIC_BASE_URL`
- `SERPER_API_KEY`
- `LLM_API_KEY`
- `HF_SPACE_URL` (required in Railway to offload VTON to HF ZeroGPU)

### Required for Hugging Face Space

- Any model/auth environment needed for OOTDiffusion runtime in Space.
- If using private models, configure corresponding HF token secrets in Space settings.

## Procfile Process Types

`Procfile` defines both process entries used by Railway:

- `web`: FastAPI app
- `worker`: Celery worker
