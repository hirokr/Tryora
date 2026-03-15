# Tryora FastAPI Server — Complete Build Guide
### Claude Code + claude-sonnet-4-6 | Step-by-Step Prompts & Instructions

---

> **How to use this document**
> Follow phases in strict order. Each phase has two parts:
> - **YOU DO** — terminal commands or manual steps you perform
> - **CLAUDE CODE PROMPT** — paste this exactly into the Claude Code session
>
> Never skip a phase. Each one produces files the next phase depends on.
> Use `/clear` in Claude Code between every phase to reset the context window.

---

## Pre-Flight Checklist

Complete every item before opening Claude Code for the first time.

- [ ] Claude Pro subscription active at claude.ai ($20/month)
- [x] Node.js 18+ installed: `node --version`
- [x] Python 3.11+ installed: `python3 --version`
- [x] git installed: `git --version`
- [x] Windows users only: WSL2 installed and set as default terminal
- [x] Accounts created (all free):
  - [x] [Supabase](https://supabase.com) — PostgreSQL database
  - [x] [Upstash](https://upstash.com) — Redis (free tier)
  - [x] [Cloudflare R2](https://dash.cloudflare.com) — file storage (zero egress)
  - [ ] [HuggingFace](https://huggingface.co) — for ZeroGPU model hosting
  - [ ] [Railway](https://railway.app) — Express.js gateway (later)
  - [ ] [Vercel](https://vercel.com) — Next.js frontend (later)
- [x] Credentials collected in a `.env.local` scratch file (NOT committed to git):
  ```
  SUPABASE_DB_URL=
  UPSTASH_REDIS_URL=
  UPSTASH_REDIS_TOKEN=
  R2_ACCOUNT_ID=
  R2_ACCESS_KEY_ID=
  R2_SECRET_ACCESS_KEY=
  R2_BUCKET_NAME=tryora-assets
  ANTHROPIC_API_KEY=        # from console.anthropic.com
  SERPER_API_KEY=           # from serper.dev (free tier: 2500 searches)
  ```

---

## PHASE 0 — Install Claude Code and Configure Model

### YOU DO

```bash
# Step 1: Install Claude Code
curl -fsSL https://claude.ai/install.sh | bash
source ~/.bashrc          # or: source ~/.zshrc on macOS

# Step 2: Verify install
claude --version
claude doctor

# Step 3: Pin model to claude-sonnet-4-6 globally
mkdir -p ~/.claude
cat > ~/.claude/settings.json << 'EOF'
{
  "model": "claude-sonnet-4-6"
}
EOF

# Step 4: Create and initialise your project folder
mkdir -p ~/projects/tryora/fastapi-server
cd ~/projects/tryora/fastapi-server
git init
git branch -M main

# Step 5: Launch Claude Code (browser login opens automatically)
claude
```

### VERIFY INSIDE CLAUDE CODE SESSION

Type this after Claude Code opens:
```
/status
```
Confirm the model shown is `claude-sonnet-4-6`. If not, type `/model` and select it.

---

## PHASE 1 — Create the CLAUDE.md Context File

### YOU DO

Create this file manually at the project root **before** running any Claude Code prompts.
This file is the single most important thing in the entire project.

```bash
# Still in ~/projects/tryora/fastapi-server
cat > CLAUDE.md << 'CLAUDEMD'
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

fastapi-server/
  app/
    main.py              # FastAPI app, /health endpoint only
    routers/
      jobs.py            # POST /jobs — receives job type + payload, enqueues
      health.py          # GET /health, GET /health/celery
    tasks/
      avatar.py          # Celery task: avatar_generation
      vton.py            # Celery task: try_on_scene
      search.py          # Celery task: dress_search
    services/
      avatar_service.py  # HMR2.0, SMPL-X, GLB export logic
      vton_service.py    # OOTDiffusion inference logic
      search_service.py  # Serper API + LLM extraction logic
      storage_service.py # Cloudflare R2 upload/download helpers
    models/
      job_schemas.py     # Pydantic models for all job payloads
      dress_schema.py    # Pydantic model for scraped dress data
    core/
      config.py          # All env var loading via pydantic-settings
      celery_app.py      # Celery instance, Redis broker config
      db.py              # Prisma client singleton
      r2_client.py       # boto3 S3 client pointed at R2
  tests/
    test_search_service.py
    test_storage_service.py
    test_vton_service.py
  requirements.txt
  .env                   # never commit this
  .env.example           # commit this — no real values
  Dockerfile
  docker-compose.yml     # for local dev: redis + worker + api
CLAUDEMD
```
# Verify file was created
cat CLAUDE.md
```

---

## PHASE 2 — Scaffold Project Structure and Core Config

### YOU DO
```bash
cd ~/projects/tryora/fastapi-server
claude   # open Claude Code, confirm model with /status
```

### CLAUDE CODE PROMPT
```
Read the CLAUDE.md file in this project root to understand the full system context.

Then scaffold the complete Tryora FastAPI server folder structure exactly as specified in CLAUDE.md.
Create ALL the following:

1. The full folder structure: app/routers/, app/tasks/, app/services/, app/models/, app/core/, tests/

2. app/core/config.py — use pydantic-settings BaseSettings to load ALL env vars:
   SUPABASE_DB_URL, UPSTASH_REDIS_URL, UPSTASH_REDIS_TOKEN,
   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME,
   ANTHROPIC_API_KEY, SERPER_API_KEY.
   Include a get_settings() function with lru_cache.

3. app/core/celery_app.py — Celery instance using Redis as broker and backend.
   Read broker URL from settings. Set task serializer to json.
   Include a celery_health_check() helper that pings the broker.

4. app/core/r2_client.py — boto3 S3 client configured for Cloudflare R2.
   Endpoint URL must be https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com.
   Include upload_file(local_path, s3_key) and get_presigned_url(s3_key, expiry=3600) helpers.

5. app/core/db.py — Prisma client singleton with connect/disconnect lifecycle.

6. app/main.py — FastAPI app with lifespan context manager that connects/disconnects
   Prisma on startup/shutdown. Include CORS for localhost:3000 (Express dev).
   Mount app/routers/health.py and app/routers/jobs.py.

7. app/routers/health.py — GET /health returns {status: ok, model: fastapi}.
   GET /health/celery calls celery_health_check() and returns broker status.

8. app/routers/jobs.py — POST /jobs accepts {jobType: str, payload: dict}.
   Based on jobType, route to the correct Celery task (.delay()).
   Return {jobId, status: PENDING} immediately. Never block on AI processing.

9. app/models/job_schemas.py — Pydantic models:
   AvatarJobPayload, VtonJobPayload, DressSearchPayload, JobResponse.

10. requirements.txt with pinned versions:
    fastapi==0.115.0, uvicorn[standard]==0.30.6, celery==5.4.0,
    redis==5.0.8, prisma==0.15.0, pydantic-settings==2.5.2,
    boto3==1.35.0, anthropic==0.34.0, httpx==0.27.2, python-dotenv==1.0.1,
    smplx==0.1.28, torch==2.4.1, diffusers==0.30.0, transformers==4.44.0,
    Pillow==10.4.0, numpy==1.26.4, pytest==8.3.3, pytest-asyncio==0.24.0.

11. .env.example — all env var names with empty values, safe to commit.

12. A stub __init__.py in every package folder.

After creating all files, run: python3 -c "from app.core.config import get_settings; print(get_settings())"
Fix any import errors before finishing.
```

### AFTER PROMPT COMPLETES
```bash
# Create your real .env file from the example
cp .env.example .env
# Fill in your actual credentials from your .env.local scratch file
nano .env

# Test the config loads
python3 -c "from app.core.config import get_settings; print('Config OK')"

# Commit the scaffold
git add -A
git commit -m "feat: scaffold project structure and core config"

# Clear Claude Code context before next phase
# (type inside Claude Code)
```
Type `/clear` inside Claude Code.

---

## PHASE 3 — Docker Compose for Local Development

### YOU DO
```bash
# Make sure you are still in ~/projects/tryora/fastapi-server
# Start a fresh Claude Code session
claude
```

### CLAUDE CODE PROMPT
```
Read CLAUDE.md for project context.

Create a docker-compose.yml for local development that runs three services:

1. redis — use image redis:7-alpine. Expose port 6379.
   This is the Celery broker and job result backend.

2. api — build from the project Dockerfile. Expose port 8000.
   Mount the project folder as a volume for hot reload.
   Run: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   Load all env vars from the .env file.
   Depends on: redis.

3. worker — same Dockerfile as api. No exposed port.
   Run: celery -A app.core.celery_app worker --loglevel=info --concurrency=1
   Load all env vars from .env file.
   Depends on: redis.

Also create the Dockerfile:
- Base image: python:3.11-slim
- Install system deps: build-essential, libglib2.0-0, libsm6, libxext6
  (required for OpenCV and PIL used by the AI models)
- Copy requirements.txt and pip install
- Copy app/ directory
- Default CMD: uvicorn app.main:app --host 0.0.0.0 --port 8000

After creating both files, verify with:
docker compose config
```

### AFTER PROMPT COMPLETES
```bash
# Start local environment
docker compose up -d redis

# Test the API without Docker first (faster for development)
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# In a new terminal: test health endpoint
curl http://localhost:8000/health

git add -A
git commit -m "feat: add Docker Compose local dev environment"
```
Type `/clear` inside Claude Code.

---

## PHASE 4 — Dress Search Task (Build This First — No GPU Required)

> Build this first because it requires no GPU and proves the full async pipeline
> works end-to-end before tackling the heavy AI tasks.

### YOU DO
```bash
claude   # fresh session
```

### CLAUDE CODE PROMPT
```
Read CLAUDE.md for full system context.

Implement the complete DRESS_SEARCH Celery task. This task needs no GPU.

1. app/services/search_service.py — implement two functions:

   extract_search_params(prompt: str) -> dict:
   - Call Anthropic claude-sonnet-4-6 using the anthropic Python SDK
   - System prompt: "You are a fashion search parameter extractor.
     Given a user's natural language description, return ONLY a valid JSON object
     with keys: style (str), colors (list[str]), event_type (str), garment_type (str).
     No explanation. No markdown. JSON only."
   - User message: the prompt
   - Parse and return the JSON from the response
   - Raise ValueError with clear message if JSON parsing fails

   search_dresses(params: dict) -> list[dict]:
   - Call Serper API (https://google.serper.dev/shopping) with POST
   - Headers: X-API-KEY from settings, Content-Type: application/json
   - Body: {q: "{style} {garment_type} {colors[0]} dress site:myntra.com OR site:ajio.com",
            gl: "in", num: 10}
   - Parse results into a list of dicts with keys:
     title, price, imageUrl, storeUrl, brand
   - Return empty list on API error, never raise

2. app/tasks/search.py — Celery task dress_search_task(job_id, payload):
   - Update ai_jobs status to PROCESSING in PostgreSQL via Prisma
   - Call extract_search_params(payload["prompt"])
   - Call search_dresses(params)
   - Upsert each dress into the dresses table (skip duplicates by storeUrl)
   - Update ai_jobs status to COMPLETED with result as JSON list of dress IDs
   - On ANY exception: update ai_jobs status to FAILED with error message, re-raise

3. tests/test_search_service.py — pytest tests:
   - test_extract_search_params_returns_valid_json: mock the Anthropic client,
     assert the returned dict has all four required keys
   - test_extract_search_params_raises_on_bad_json: mock client to return
     non-JSON text, assert ValueError is raised
   - test_search_dresses_handles_api_error: mock httpx to raise, assert empty list returned

Run the tests: pytest tests/test_search_service.py -v
Fix all failures before finishing.
```

### AFTER PROMPT COMPLETES
```bash
pytest tests/test_search_service.py -v

# Manual smoke test (requires .env with real keys)
python3 -c "
from app.services.search_service import extract_search_params
import asyncio
result = asyncio.run(extract_search_params('blue beach wedding dress'))
print(result)
"

git add -A
git commit -m "feat: implement dress search task with LLM param extraction"
```
Type `/clear` inside Claude Code.

---

## PHASE 5 — Storage Service (Cloudflare R2)

### YOU DO
```bash
claude
```

### CLAUDE CODE PROMPT
```
Read CLAUDE.md for project context.

Implement the complete storage service for Cloudflare R2 in app/services/storage_service.py.

Implement these functions (all async):

1. upload_from_url(source_url: str, destination_key: str) -> str:
   - Download file from source_url using httpx (with timeout=60s)
   - Upload bytes to R2 bucket using the r2_client from app/core/r2_client.py
   - Return the presigned GET URL (1 hour expiry)

2. upload_from_path(local_path: str, destination_key: str, content_type: str) -> str:
   - Read file from local_path
   - Upload to R2 with the given content_type
   - Return presigned GET URL

3. upload_bytes(data: bytes, destination_key: str, content_type: str) -> str:
   - Upload raw bytes to R2 directly
   - Return presigned GET URL

4. generate_avatar_key(user_id: str) -> str:
   - Returns: avatars/{user_id}/{uuid4()}.glb

5. generate_vton_key(user_id: str, job_id: str) -> str:
   - Returns: vton/{user_id}/{job_id}.png

6. generate_dress_image_key(dress_id: str) -> str:
   - Returns: dresses/{dress_id}.jpg

Write tests in tests/test_storage_service.py:
- test_upload_from_url_success: mock httpx and boto3, assert returns a URL string
- test_upload_from_url_timeout: mock httpx to raise TimeoutException, assert StorageError raised
- test_generate_keys_format: assert each key generation function returns correct prefix and extension

Create a custom StorageError exception class in app/core/exceptions.py.
Import and use it in the storage service.

Run: pytest tests/test_storage_service.py -v
Fix all failures.
```

### AFTER PROMPT COMPLETES
```bash
pytest tests/test_storage_service.py -v

git add -A
git commit -m "feat: implement R2 storage service with upload helpers"
```
Type `/clear` inside Claude Code.

---

## PHASE 6 — Avatar Generation Task (SMPL-X Pipeline)

> This phase builds the body reconstruction pipeline.
> The AI models run on Kaggle/Colab for development, then HF ZeroGPU for deployment.

### YOU DO
```bash
claude
```

### CLAUDE CODE PROMPT
```
Read CLAUDE.md for project context.

Implement the AVATAR_GENERATION pipeline in app/services/avatar_service.py.

The pipeline receives three photo URLs (front, side, back) and produces a GLB file.

1. Download all three photos to temp files using httpx.

2. body_estimation(front_path, side_path, back_path) -> dict:
   - Use the multi-view input to estimate SMPL-X parameters
   - For now: implement this as a stub that logs "HMR2.0 estimation running"
     and returns synthetic plausible SMPL-X params:
     {betas: [0.0]*10, global_orient: [0.0]*3, body_pose: [0.0]*63,
      height_estimate: 1.65, weight_estimate: 60.0}
   - Add a TODO comment: "Replace stub with real HMR2.0 inference via
     4D-Humans/HMR2 when GPU compute is available"

3. generate_body_mesh(smplx_params: dict) -> trimesh.Trimesh:
   - Use the smplx library to create a body model instance
   - Apply the beta and pose parameters
   - Return the resulting mesh as a trimesh.Trimesh object
   - Put the body in A-pose (zero out body_pose, set standard A-pose shoulder angles)

4. export_glb(mesh: trimesh.Trimesh, output_path: str) -> str:
   - Export the trimesh mesh to GLB format at output_path
   - Return output_path

5. run_avatar_pipeline(job_id, user_id, front_url, side_url, back_url) -> str:
   - Orchestrate steps 1-4
   - Upload GLB to R2 using storage_service.upload_from_path()
   - Return the R2 presigned URL
   - Clean up all temp files in a finally block

6. app/tasks/avatar.py — Celery task avatar_generation_task(job_id, payload):
   - Update ai_jobs to PROCESSING
   - Call run_avatar_pipeline with payload fields
   - Update ai_jobs to COMPLETED with result_url
   - On exception: update to FAILED, re-raise

Write tests in tests/test_avatar_service.py:
- test_generate_body_mesh_returns_trimesh: assert output is trimesh.Trimesh instance
- test_export_glb_creates_file: assert file exists and has .glb extension
- test_run_avatar_pipeline_cleans_temp_files: mock R2 upload, assert no temp files remain

Install trimesh if not in requirements.txt: add trimesh==4.4.1.

Run: pytest tests/test_avatar_service.py -v
Fix all failures.
```

### AFTER PROMPT COMPLETES
```bash
pytest tests/test_avatar_service.py -v

git add -A
git commit -m "feat: implement avatar generation pipeline with SMPL-X mesh export"
```
Type `/clear` inside Claude Code.

---

## PHASE 7 — VTON Task (OOTDiffusion Pipeline)

### YOU DO
```bash
claude
```

### CLAUDE CODE PROMPT
```
Read CLAUDE.md for project context.

Implement the TRY_ON_SCENE pipeline in app/services/vton_service.py.

Important license note already in CLAUDE.md: we use OOTDiffusion (Apache 2.0).
DO NOT use IDM-VTON, CatVTON, or StableVITON — all are CC BY-NC-SA 4.0 non-commercial.

1. render_avatar_to_image(glb_url: str, output_path: str) -> str:
   - Download the GLB from glb_url
   - Use pyrender to render a front-facing view of the mesh to a 512x768 PNG
   - Save to output_path, return output_path
   - Camera: orthographic, positioned 2m in front of avatar
   - Add TODO: "Add pose selection — currently renders only A-pose front view"

2. run_ootdiffusion(person_image_path: str, garment_image_path: str) -> PIL.Image:
   - Load OOTDiffusion pipeline:
     OotdPipeline.from_pretrained("levihsu/OOTDiffusion", torch_dtype=torch.float16)
   - Run inference with:
     num_inference_steps=20, guidance_scale=2.0, num_images_per_prompt=1
   - Return the first generated PIL Image
   - Wrap in try/except — on GPU OOM error, retry with num_inference_steps=10
   - Add module-level _pipeline = None and lazy-load it on first call (model loading takes ~30s)

3. generate_background(scene_prompt: str, size=(768, 512)) -> PIL.Image:
   - Use diffusers StableDiffusionPipeline (runwayml/stable-diffusion-v1-5)
   - Prompt: f"fashion photography background, {scene_prompt}, professional lighting,
     8k, photorealistic, no people"
   - Return PIL Image
   - Same lazy-load pattern as OOTDiffusion

4. composite_vton_with_background(vton_image: PIL.Image, bg_image: PIL.Image) -> PIL.Image:
   - Use PIL to remove the white background from vton_image (threshold: 240)
   - Paste vton_image centered over bg_image
   - Return composited PIL Image

5. run_vton_pipeline(job_id, user_id, avatar_glb_url, dress_image_url, scene_prompt) -> str:
   - Orchestrate steps 1-4
   - Save final composite image to temp file
   - Upload to R2 using generate_vton_key()
   - Return R2 URL
   - Clean up temp files in finally block

6. app/tasks/vton.py — Celery task vton_task(job_id, payload):
   - Update ai_jobs to PROCESSING
   - Call run_vton_pipeline
   - Update ai_jobs to COMPLETED with result_url
   - On exception: FAILED

Write tests in tests/test_vton_service.py:
- test_composite_vton_with_background: create two solid colour PIL images, assert output size matches
- test_render_avatar_to_image_output_exists: mock pyrender, assert PNG file is created
- test_run_vton_pipeline_cleans_temp: mock all AI calls and R2 upload, assert no temp files remain

Run: pytest tests/test_vton_service.py -v
```

### AFTER PROMPT COMPLETES
```bash
pytest tests/test_vton_service.py -v

git add -A
git commit -m "feat: implement VTON pipeline with OOTDiffusion and scene generation"
```
Type `/clear` inside Claude Code.

---

## PHASE 8 — Wire Up the Jobs Router and End-to-End Test

### YOU DO
```bash
claude
```

### CLAUDE CODE PROMPT
```
Read CLAUDE.md for project context.

The individual tasks are built. Now wire them into the jobs router and validate
the full request-to-queue flow works end-to-end.

1. Update app/routers/jobs.py:
   - POST /jobs endpoint accepts JobRequest(jobType: str, payload: dict)
   - Generate a unique job_id (UUID4)
   - Insert a new row into ai_jobs via Prisma:
     {id: job_id, job_type: jobType, status: PENDING, payload: JSON(payload)}
   - Route to Celery task by jobType:
     AVATAR_GENERATION -> avatar_generation_task.delay(job_id, payload)
     TRY_ON_SCENE      -> vton_task.delay(job_id, payload)
     DRESS_SEARCH      -> dress_search_task.delay(job_id, payload)
   - Return JobResponse(jobId=job_id, status="PENDING")
   - Raise 400 HTTPException for unknown jobType

2. Add GET /jobs/{job_id} endpoint:
   - Query ai_jobs table by id
   - Return {jobId, status, resultUrl, error} (resultUrl/error may be null)
   - Raise 404 if not found

3. Update app/routers/health.py GET /health/celery:
   - Call celery_health_check() from core/celery_app.py
   - Return {broker: "ok"} or {broker: "error", detail: str} with appropriate status codes

4. Write a complete integration test in tests/test_jobs_router.py using FastAPI TestClient:
   - test_post_dress_search_job_returns_pending: POST /jobs with DRESS_SEARCH payload,
     mock Celery .delay(), mock Prisma insert, assert response has jobId and status PENDING
   - test_get_job_status_returns_job: mock Prisma query, assert GET /jobs/{id} returns correct fields
   - test_post_unknown_job_type_returns_400: assert 400 status code

5. Create a Prisma schema file at prisma/schema.prisma with all tables from CLAUDE.md:
   users, avatars, dresses, user_saved_dresses, ai_jobs, generated_scenes.
   Use the exact field names from the system architecture.
   Add @@map for snake_case table names.

Run: pytest tests/test_jobs_router.py -v
Fix all failures.
```

### AFTER PROMPT COMPLETES
```bash
pytest tests/ -v --tb=short   # run ALL tests together

git add -A
git commit -m "feat: wire jobs router end-to-end, add Prisma schema"
```
Type `/clear` inside Claude Code.

---

## PHASE 9 — Error Handling, Logging, and Rate Limiting

### YOU DO
```bash
claude
```

### CLAUDE CODE PROMPT
```
Read CLAUDE.md for project context.

Harden the server with proper error handling, structured logging, and rate limiting.

1. app/core/exceptions.py — define custom exceptions:
   - StorageError(Exception) — R2 upload/download failures
   - ModelInferenceError(Exception) — AI model failures (OOM, timeout, bad output)
   - ExternalAPIError(Exception) — Serper or Anthropic API failures
   - JobNotFoundError(Exception) — DB lookup failure

2. app/core/logging.py — configure structured JSON logging:
   - Use Python's logging module with a custom JSON formatter
   - Include fields: timestamp, level, service="tryora-fastapi",
     job_id (when available), message
   - Set log level from env var LOG_LEVEL (default INFO)
   - Apply to all app.* loggers

3. Add exception handlers to app/main.py:
   - StorageError -> 503 with {error: "Storage unavailable", detail: str}
   - ModelInferenceError -> 503 with {error: "Model inference failed", detail: str}
   - ExternalAPIError -> 502 with {error: "External API error", detail: str}
   - Generic Exception -> 500 with {error: "Internal server error"} — do NOT leak detail

4. Add rate limiting to POST /jobs using slowapi:
   - Add slowapi==0.1.9 to requirements.txt
   - Limit: 10 requests per minute per IP
   - Return 429 with {error: "Rate limit exceeded"} when triggered

5. Add request ID middleware to app/main.py:
   - Generate UUID4 per request
   - Add as X-Request-ID response header
   - Include in all log messages for that request

6. Update all tasks (avatar.py, vton.py, search.py) to:
   - Use the structured logger (not print statements)
   - Catch specific exceptions and map to the custom exception types
   - Log job_id with every log line

Run: pytest tests/ -v
Ensure no existing tests break.
```

### AFTER PROMPT COMPLETES
```bash
pytest tests/ -v

git add -A
git commit -m "feat: add structured logging, error handling, rate limiting"
```
Type `/clear` inside Claude Code.

---

## PHASE 10 — South Asian Garment Specialization

> This is Tryora's core competitive moat. Global competitors cannot easily replicate this.

### YOU DO
```bash
claude
```

### CLAUDE CODE PROMPT
```
Read CLAUDE.md for project context.

Add South Asian garment specialization to the VTON pipeline.
Target garments: sari, salwar kameez, lehenga, dupatta, anarkali, kurti.

1. app/services/garment_classifier.py:
   - classify_garment(image_path: str) -> dict:
     Use a CLIP-style zero-shot classification approach.
     Load openai/clip-vit-base-patch32 from HuggingFace.
     Classify into: {"type": one of [sari, salwar_kameez, lehenga, western_dress,
     anarkali, kurti, unknown], "is_south_asian": bool, "confidence": float}
   - Use lazy loading — only load CLIP model on first call
   - Cache result on the image hash so the same image is never classified twice

2. app/services/vton_service.py — update run_vton_pipeline():
   - Before running OOTDiffusion, call classify_garment(garment_image_path)
   - If is_south_asian is True, apply south_asian_preprocessing()
   - Log the classification result with job_id

3. app/services/south_asian_preprocessing.py:
   - south_asian_preprocessing(garment_image: PIL.Image, garment_type: str) -> PIL.Image:
     For sari: pad the image to 2:3 aspect ratio (saris are tall, draping length)
     For salwar_kameez: split into kurta and dupatta regions if confidence > 0.8
     For all types: enhance fabric texture detail (PIL sharpness +30%)
     Return preprocessed image

   - get_south_asian_scene_prefix(garment_type: str) -> str:
     Returns culturally relevant scene prompt prefixes:
     sari -> "elegant South Asian celebration, soft golden hour lighting"
     salwar_kameez -> "casual South Asian street, warm afternoon light"
     lehenga -> "grand Indian wedding ceremony, ornate backdrop"
     default -> "" (empty, use user's scene prompt as-is)

4. Update run_vton_pipeline() to prepend the scene prefix to scene_prompt
   when garment is South Asian.

5. Add tests in tests/test_south_asian.py:
   - test_classify_garment_returns_valid_type: mock CLIP, assert type in allowed list
   - test_south_asian_preprocessing_preserves_size: assert output PIL size unchanged
   - test_scene_prefix_for_sari: assert prefix contains "South Asian"

Run: pytest tests/ -v
```

### AFTER PROMPT COMPLETES
```bash
pytest tests/ -v

git add -A
git commit -m "feat: South Asian garment classification and culturally aware scene generation"
```
Type `/clear` inside Claude Code.

---

## PHASE 11 — Deployment Configuration

### YOU DO
```bash
claude
```

### CLAUDE CODE PROMPT
```
Read CLAUDE.md for project context.

Prepare the server for deployment on free-tier infrastructure.

1. Create a Procfile for Railway deployment:
   web: uvicorn app.main:app --host 0.0.0.0 --port $PORT
   worker: celery -A app.core.celery_app worker --loglevel=info --concurrency=1

2. Create railway.toml:
   - Build command: pip install -r requirements.txt
   - Start command: uvicorn app.main:app --host 0.0.0.0 --port $PORT

3. Create a Hugging Face Space configuration (app.py in project root):
   - This exposes OOTDiffusion as a ZeroGPU Gradio endpoint
   - Import the vton_service pipeline loader
   - Expose a single Gradio interface: inputs [person_image, garment_image],
     output [result_image]
   - Decorate inference function with @spaces.GPU
   - This file is ONLY used when deployed to HF Spaces — not the main FastAPI app

4. Update app/services/vton_service.py — add HF_SPACE_URL env var:
   - If HF_SPACE_URL is set: instead of running OOTDiffusion locally,
     call the HF Space Gradio API via httpx and return the result image
   - If HF_SPACE_URL is not set: run OOTDiffusion locally (for local dev with GPU)
   - This allows Railway (no GPU) to offload inference to HF ZeroGPU for free

5. Add a DEPLOYMENT.md file documenting:
   - How to deploy FastAPI to Railway (link env vars, push git)
   - How to deploy OOTDiffusion Space to HuggingFace (set HF_SPACE_URL in Railway)
   - How to run Celery worker on Railway as a separate service
   - Which env vars are required for each service

6. Update .env.example with the new HF_SPACE_URL variable.

Run: pytest tests/ -v — no regressions.
```

### AFTER PROMPT COMPLETES
```bash
pytest tests/ -v

git add -A
git commit -m "feat: Railway and HuggingFace deployment configuration"
```

---

## PHASE 12 — Final Audit and README

### YOU DO
```bash
claude
```

### CLAUDE CODE PROMPT
```
Read CLAUDE.md for project context.

Perform a final audit of the entire codebase and write the README.

1. Audit checklist — check every item and fix anything failing:
   - [ ] No hardcoded credentials anywhere (grep for any key strings)
   - [ ] All Celery tasks update ai_jobs to FAILED on exception (not just COMPLETED)
   - [ ] All temp files are cleaned up in finally blocks
   - [ ] All external HTTP calls have timeouts set (never open-ended)
   - [ ] CLAUDE.md is still accurate (update if any folder structure changed)
   - [ ] .env is in .gitignore
   - [ ] requirements.txt has all imported packages

2. Write README.md covering:
   - Project purpose (2 sentences)
   - Architecture position (this is the AI engine, not the user-facing API)
   - Local setup (clone, copy .env.example to .env, fill values, docker compose up)
   - Running tests (pytest tests/ -v)
   - The three job types and their payloads (with example JSON for each)
   - Deployment instructions (brief, link to DEPLOYMENT.md for details)
   - License (MIT for your own code; note OOTDiffusion is Apache 2.0)

3. Run the full test suite one final time:
   pytest tests/ -v --tb=short --cov=app --cov-report=term-missing

   Report which files have below 70% coverage and what would be needed to reach it.

4. Create a final git tag:
   After confirming all tests pass, output the exact commands to run:
   git add -A
   git commit -m "docs: README, final audit, coverage report"
   git tag v0.1.0-scaffold
```

### AFTER PROMPT COMPLETES
```bash
pytest tests/ -v --tb=short

git add -A
git commit -m "docs: README, final audit, coverage report"
git tag v0.1.0-scaffold

echo "Phase 12 complete. FastAPI server scaffold is production-ready."
```

---

## Quick Reference — Claude Code Commands

| Command | When to use |
|---|---|
| `/status` | Check model (should show claude-sonnet-4-6) |
| `/clear` | After every phase — resets context window |
| `/compact` | Mid-phase if context gets long |
| `/model` | Switch model interactively if needed |
| `/exit` | Close Claude Code |

## Quick Reference — Prompting Best Practices for Tryora

**Always start prompts with:** `Read CLAUDE.md for project context.`
This ensures Claude Code has Tryora's async architecture in mind before generating code.

**Be specific about what NOT to do:**
- "Do NOT use IDM-VTON or CatVTON — they are non-commercial licensed"
- "Do NOT make blocking AI calls inside route handlers — use Celery tasks"
- "Do NOT hardcode credentials — read from settings via get_settings()"

**For debugging sessions:**
```
I am getting this error: [paste full traceback]
Check [filename] and any files it imports. Find the root cause and fix it.
Do not change the function signatures — only fix the internal logic.
```

**For adding a new feature mid-project:**
```
Read CLAUDE.md. I need to add [feature].
It should follow the same patterns as [existing similar feature].
Update the relevant service, create a Celery task if needed,
add it to the jobs router, and write pytest tests.
```

---

## Build Order Summary

| Phase | What Gets Built | GPU Required? | Est. Time |
|---|---|---|---|
| 0 | Claude Code install + model config | No | 20 min |
| 1 | CLAUDE.md context file | No | 10 min |
| 2 | Project scaffold + core config | No | 30 min |
| 3 | Docker Compose local env | No | 20 min |
| 4 | Dress search task (LLM + Serper) | No | 45 min |
| 5 | R2 storage service | No | 30 min |
| 6 | Avatar generation (SMPL-X) | Kaggle T4 | 60 min |
| 7 | VTON pipeline (OOTDiffusion) | Kaggle T4 | 60 min |
| 8 | Jobs router end-to-end | No | 45 min |
| 9 | Error handling + logging | No | 30 min |
| 10 | South Asian garment specialization | No | 45 min |
| 11 | Deployment config | No | 30 min |
| 12 | Final audit + README | No | 30 min |

**Total estimated time: 7–9 hours across multiple sessions**

---

*Tryora FastAPI Build Guide — generated for claude-sonnet-4-6 + Claude Code*
*Follow phases in order. Use /clear between every phase.*