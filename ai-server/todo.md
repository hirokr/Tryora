# Tryora — FastAPI AI Server TODO

> This file tracks all tasks for the Python FastAPI server, which acts as the **AI & Scraping Engine**. It handles the LLM prompting, Serper-based web scraping, 3D avatar generation (PIFuHD/SMPL-X), Virtual Try-On (VTON), Stable Diffusion background generation, and Celery async task workers.
> Legend: `[x]` = Done · `[ ]` = Pending

---

## Phase 0 — Project Bootstrap & Infrastructure

- [x] **FastAPI app initialized** — `app/main.py` bootstraps the FastAPI instance with title, version, and lifespan handler
- [x] **Prisma client connected** — `app/db/prisma_connect.py` manages DB connection via lifespan context manager
- [x] **Configuration management** — `app/core/config.py` loads all env vars (API keys, DB URL, Redis URL, Chroma host) via Pydantic `BaseSettings`; `.env`, `.env.example` externalize secrets
- [x] **Structured logging** — Loguru-based logger configured in `app/core/logger.py`
- [x] **Health check endpoint** — `GET /api/v1/health` implemented in `app/api/v1/health.py`
- [x] **Prisma schema** — `prisma/schema.prisma` mirrors the Express server's PostgreSQL schema (User, ProcessingJob, etc.)
- [x] **`pyproject.toml` & `requirements.txt`** — Dependency management configured; Python version pinned via `.python-version`
- [x] **Dockerfile** — Production-ready Dockerfile written
- [x] **Test scaffold** — `tests/test_api.py` scaffold created; `pytest` configured via `pyproject.toml`
- [x] **ChromaDB vector store** — `app/db/vectordb.py` wraps ChromaDB client; collection `web_scrapes` used for scraped-page embeddings
- [ ] **Docker Compose GPU profile** — Add a `docker-compose.override.yml` profile for GPU-enabled Celery workers using `deploy.resources.reservations.devices` (NVIDIA runtime)
- [ ] **Alembic or Prisma migration CI step** — Automate `prisma db push` / `prisma generate` in the startup script or CI pipeline

---

## Phase 1 — Internal API Key Security

- [x] **`secure_keys` middleware** — `app/middleware/secure_keys.py` validates `X-Internal-Api-Key` header on incoming requests from Express
- [x] **API key dependency** — `checkApiKey` FastAPI dependency injected on protected routes
- [ ] **Apply `checkApiKey` to ALL internal endpoints** — Ensure every route under `/internal/ai/` uses `Depends(checkApiKey)` and is not accidentally exposed publicly
- [ ] **Key rotation support** — Accept a comma-separated list of valid keys in env var to allow zero-downtime key rotation
- [ ] **Audit log middleware** — `app/middleware/audit_log.py` is present; verify it is recording request metadata (timestamp, route, requester IP) to the `AuditLog` Postgres table

---

## Phase 2 — LLM Integration (Search Parameter Extraction)

- [x] **OpenRouter / OpenAI client** — `app/domains/embeddings/openapi.py` wraps `AsyncOpenAI` pointing at OpenRouter; `get_embeddings()` implemented using `text-embedding-3-small`
- [x] **Reasoning domain stub** — `app/domains/reasoning/xai.py` created (xAI / Grok integration stub)
- [ ] **`POST /internal/ai/scrape`** — Implement endpoint that:
  1. Receives `{ prompt: "beach wedding" }` from Express
  2. Calls the LLM to extract structured search parameters using **structured output / Instructor**:
     ```json
     {
     	"style": "floral, maxi",
     	"event": "beach wedding",
     	"colors": ["yellow", "pink"]
     }
     ```
  3. Validates the structured output against a Pydantic schema (prevent LLM hallucinations)
  4. Passes extracted parameters to `WebSearch.search()` → Serper API
  5. Passes top URLs to `WebScrapperAPIFY.scrape()` to fetch full page content
  6. Parses scraped data into `Garment` records and saves to Postgres
  7. Returns `[ { dressId, name, imageUrl, storeLink, price } ]` to Express synchronously
- [ ] **Instructor / structured output** — Integrate the `instructor` library (or LangChain structured outputs) to force the LLM to always return a valid JSON schema — prevents hallucinations and malformed output
- [ ] **LLM provider abstraction** — Create a `BaseLLMClient` abstract class so `OpenAPI`, `xai.py`, and any future providers (Gemini, Claude) are interchangeable without changing endpoint logic
- [ ] **Prompt versioning** — Store all LLM system prompts in a dedicated `app/prompts/` directory as plain-text or YAML files; version-control them separately from code

---

## Phase 3 — Web Search & Scraping

- [x] **`WebSearch` class** — `app/domains/searching/webSearch.py` — async Serper API integration; `search(query, num_results)` → returns `[ { title, link, snippet, position } ]`
- [x] **`WebScrapperAPIFY` class** — `app/domains/scrapping/web_scrapper.py` — Apify client integration; full-page markdown extraction with vector embedding chunking (`_chunk_text`, `_CHUNK_SIZE = 2000`)
- [x] **Vector embeddings pipeline** — `web_scrapper.py` uses `open_api.get_embeddings()` + ChromaDB `web_scrapes` collection to store and retrieve scraped content by semantic similarity
- [x] **Markdown file persistence** — Scraped pages saved to `app/scraped_content/` directory as markdown files with URL-derived slugs
- [ ] **`WebScrapper` (SerperScrapeWebsiteTool)** — The `crewai_tools`-based `WebScrapper` class is imported but commented out in `main.py`; decide whether to use Apify or crewai and remove/integrate the unused one
- [ ] **Fallback dress catalog** — Implement logic to return a set of generic/default dresses from the `Garment` Postgres table if both Serper API and Apify scraping fail (prevent empty results page for the user)
- [ ] **Scraping rate limit handling** — Detect `429 Too Many Requests` from Serper / Apify; implement exponential backoff and alert mechanism
- [ ] **Garment data persistence** — After scraping, save returned dress data into the Postgres `Garment` table via Prisma client before returning to Express
- [ ] **Duplicate detection** — Before inserting a new `Garment` record, check if the `storeLink` already exists (upsert logic) to avoid duplicates from repeated searches

---

## Phase 4 — Celery Task Worker Setup

- [ ] **Install and configure Celery** — Add `celery[redis]` to `requirements.txt`; create `app/worker/celery_app.py` with Redis broker and backend URLs from `settings`
- [ ] **Define task modules** — Create task files:
  - `app/worker/tasks/avatar_task.py` — GPU-bound 3D avatar generation task
  - `app/worker/tasks/tryon_task.py` — GPU-bound VTON + background generation task
- [ ] **Celery worker startup script** — Update `scripts/start.sh` to start both FastAPI (uvicorn) and Celery worker processes
- [ ] **Task result storage** — Configure Celery `result_backend` to use Redis so Express can optionally query task state directly
- [ ] **Worker concurrency tuning** — Set `CELERY_WORKER_CONCURRENCY=1` for GPU-bound tasks (only one GPU task at a time per worker); configure autoscaling for CPU-bound tasks
- [ ] **Task beat scheduler (optional)** — Set up `celery beat` for recurring jobs (e.g., cleanup expired scraper cache, purge old `ProcessingJob` records)

---

## Phase 5 — 3D Avatar Generation (`/internal/ai/avatar`)

- [ ] **`POST /internal/ai/avatar`**
  - Validate payload: `{ userId: str, images: List[str] }` (3 S3 URLs required)
  - Apply `Depends(checkApiKey)` to protect the route
  - Create a `ProcessingJob` record in Postgres with status `"queued"`
  - Drop a Celery task: `generate_avatar.delay(userId, imageUrls, jobId)`
  - Return `202 Accepted { jobId }`
- [ ] **`generate_avatar` Celery task** — Implement in `app/worker/tasks/avatar_task.py`:
  1. Download the 3 images from S3 to a temporary directory
  2. Run the 3D body estimation model (PIFuHD or SMPL-X) to generate `.glb` / `.gltf` file
  3. Upload the resulting model file to S3 using the storage utility
  4. Update `ProcessingJob` in Postgres: `status = "completed"`, `resultUrl = s3://...`
  5. If a webhook URL is configured, `POST /api/webhooks/ai-complete` to Express with the result
  6. On any error, update `ProcessingJob`: `status = "failed"`, save error message
- [ ] **PIFuHD / SMPL-X integration** — Install model dependencies; download pre-trained weights; write wrapper class in `app/domains/avatar/generator.py`
- [ ] **Temporary file cleanup** — Ensure temp files created during avatar generation are deleted after the task completes (success or failure)

---

## Phase 6 — Virtual Try-On & Scene Generation (`/internal/ai/try-on`)

- [ ] **`POST /internal/ai/try-on`**
  - Validate payload: `{ userId, avatarUrl, dressImageUrl, scenePrompt }`
  - Apply `Depends(checkApiKey)`
  - Create a `ProcessingJob` record with status `"queued"`
  - Drop Celery task: `generate_tryon.delay(userId, avatarUrl, dressImageUrl, scenePrompt, jobId)`
  - Return `202 Accepted { jobId }`
- [ ] **`generate_tryon` Celery task** — Implement in `app/worker/tasks/tryon_task.py`:
  1. Fetch the 3D avatar mesh and dress image from S3
  2. Run **Virtual Try-On (VTON) model** to composite the dress onto the avatar
  3. Generate background image using **Stable Diffusion** (Img2Img or ControlNet) based on `scenePrompt`
  4. Composite the VTON result onto the generated background
  5. Upload final JPEG to S3
  6. Update `ProcessingJob`: `status = "completed"`, `resultUrl = s3://...`
  7. Optionally fire webhook to Express
- [ ] **Stable Diffusion integration** — Integrate `diffusers` library (HuggingFace); configure GPU device; write `app/domains/scene/background_generator.py`
- [ ] **VTON model integration** — Integrate open-source VTON model (e.g., HR-VITON, OOTDiffusion); write `app/domains/tryon/vton_model.py`
- [ ] **Queue position tracking** — When Celery task is queued, save the queue position to Redis so Express can expose it during polling

---

## Phase 7 — Embeddings & Vector Search

- [x] **OpenAI embeddings via OpenRouter** — `get_embeddings()` using `text-embedding-3-small` implemented in `app/domains/embeddings/openapi.py`
- [x] **ChromaDB vector store** — `app/db/vectordb.py` wrapper wraps ChromaDB for the `web_scrapes` collection
- [x] **`firstEmbedding.json`** — First test embedding stored; confirms the pipeline works end-to-end
- [ ] **`POST /internal/ai/vector-search`** — Expose an internal endpoint so Express can query ChromaDB by semantic similarity (e.g., "find stored dresses similar to this description") without re-scraping
- [ ] **Garment embedding pipeline** — When a new `Garment` is saved, generate and store its text embedding in ChromaDB for future semantic search queries
- [ ] **Embedding model versioning** — Document which embedding model version is in use; plan for migration if the model changes (embedded vectors are not backward compatible across models)

---

## Phase 8 — Testing

- [x] **`tests/test_api.py`** — Basic API test scaffold created
- [ ] **Health check test** — `GET /api/v1/health` returns `200` with correct JSON
- [ ] **Scrape endpoint test** — Mock Serper and Apify clients; verify LLM structured output parsing works on sample responses
- [ ] **Avatar endpoint test** — Mock Celery `delay()`; verify `ProcessingJob` is created and `202` is returned
- [ ] **Try-on endpoint test** — Same pattern as avatar; mock GPU task
- [ ] **Celery task unit tests** — Test each task function in isolation using `pytest` + mocked S3 and Prisma clients
- [ ] **Reach 80% code coverage** — Configure `pytest-cov` and fail CI if coverage drops below 80%

---

## Phase 9 — Performance & Scalability

- [ ] **GPU worker auto-scaling** — Document how to scale Celery GPU workers horizontally (e.g., Kubernetes GPU node pool, AWS EC2 GPU instances with auto-scaling groups)
- [ ] **Task de-duplication** — If the same `(userId, dressId, scenePrompt)` combination is already queued/processing, return the existing `jobId` instead of creating a new one
- [ ] **S3 presigned URLs** — Return presigned S3 URLs with short TTL for model/image downloads instead of exposing bucket paths directly
- [ ] **Prometheus metrics** — Add `/metrics` endpoint using `prometheus-fastapi-instrumentator` to expose worker queue depth, task success/failure rates, and GPU utilization

---

## Backlog / Future Work

- [ ] **Multi-angle avatar rendering** — After `.glb` is generated, auto-render 360° preview frames and save as a sprite sheet for quick thumbnail display in the frontend
- [ ] **Outfit style transfer** — Fine-tune the VTON model on event-specific clothing categories
- [ ] **Content moderation on uploads** — Run uploaded images through an NSFW classifier before processing (integrates with `ContentModeration` Prisma model)
- [ ] **LangChain agent** — Replace the current direct LLM + Serper pipeline with a LangChain agent that can autonomously decide to search, scrape, or query the vector DB based on context
- [ ] **Model caching on disk** — Cache downloaded AI model weights locally on the worker machine to avoid re-downloading on each container restart
