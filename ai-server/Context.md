# Context.md — Tryora AI Server Current State

> **Generated:** 2026-04-03
> **Server:** ai-server (FastAPI) — AI & Scraping Engine for Tryora
> **Role:** Not user-facing. Express.js is the only caller.

---

## 1. What This Server Does

The ai-server is the **AI & Scraping Engine** for Tryora, an AI-powered 3D virtual try-on platform. It handles all GPU-intensive and AI tasks:

- **Dress Search** — Natural language → LLM parsing → Serper Google Shopping → web scraping → structured product results
- **3D Virtual Try-On** — Tripo AI image-to-3D → GLB generation → template compositing → S3 delivery
- **Profile Management** — Body measurements, consent, GDPR-compliant data handling
- **Template Catalog** — Pre-baked 3D dress templates (GLB) with filtering and streaming

---

## 2. Architecture Position

```
┌─────────────┐     Redis Jobs      ┌──────────────┐
│  Express.js │ ──────────────────► │  ai-server   │
│  (API GW)   │                     │  (FastAPI)    │
│             │ ◄────────────────── │              │
└─────────────┘    Poll Results     └──────────────┘
                                             │
                              ┌──────────────┼──────────────┐
                              ▼              ▼              ▼
                         PostgreSQL     Redis Cache    External APIs
                         (Supabase)     (L1 hot)       (Tripo, Serper,
                                                         ScraperAPI,
                                                         OpenRouter)
                              │
                              ▼
                         AWS S3 / R2
                         (L2 warm storage,
                          GLB files, images)
```

- **Express.js** places job tickets in Redis and polls for results
- **FastAPI** picks up jobs via Celery workers
- **Results** saved to S3/R2, status updated in PostgreSQL
- **Express** retrieves final result URLs from `ai_jobs` table

---

## 3. Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | FastAPI (Python 3.11–3.12) |
| **Package Manager** | `uv` (pyproject.toml) |
| **Database** | PostgreSQL + Prisma ORM (shared schema with Express) |
| **Task Queue** | Celery 5.x + Redis (broker + result backend) |
| **Cache** | Redis (L1) + AWS S3 (L2) |
| **Vector DB** | ChromaDB (semantic search caching) |
| **3D Generation** | Tripo AI API (image-to-3D) |
| **Web Search** | Serper.dev (Google Shopping) |
| **Web Scraping** | ScraperAPI (JS-rendered HTML) + BeautifulSoup/lxml |
| **LLM** | OpenRouter (OpenAI embeddings), Anthropic, xAI SDKs |
| **3D Processing** | trimesh, pygltflib, pyrender, smplx, xatlas, open3d |
| **Auth** | JWT (shared with Express) + API key middleware |
| **Testing** | pytest, pytest-cov, pytest-asyncio |
| **Containerization** | Docker (separate app.Dockerfile + worker.Dockerfile) |

---

## 4. Folder Structure

```
ai-server/
├── app/
│   ├── main.py                     # FastAPI app factory (create_app)
│   ├── api/                        # Router composition layer
│   │   ├── router.py               # Aggregates all feature routers
│   │   ├── admin.py                # Admin endpoints
│   │   ├── health.py               # Health check
│   │   └── deps.py                 # FastAPI deps (get_db)
│   ├── config/                     # Settings + logging
│   │   ├── settings.py             # Single source of truth (pydantic-settings)
│   │   ├── logging.py              # Logging configuration
│   │   └── constants.py            # Shared constants
│   ├── modules/                    # Feature modules (canonical — heart of app)
│   │   ├── dress_search/           # Dress search API + Celery workers
│   │   │   ├── api.py              # POST /internal/ai/search-dresses + WS/SSE
│   │   │   ├── service.py          # Business logic
│   │   │   ├── workers.py          # Celery pipeline (LLM → Serper → ScraperAPI → persist)
│   │   │   ├── parser.py           # LLM prompt → structured params
│   │   │   ├── formatter.py        # Format results via LLM
│   │   │   ├── query_builder.py    # Build Serper queries
│   │   │   ├── serper_shopping.py  # Serper Shopping API client wrapper
│   │   │   ├── scraper_api.py      # ScraperAPI client wrapper
│   │   │   └── schemas.py          # Pydantic request/response models
│   │   ├── try_on/                 # 3D try-on API, service, workers
│   │   │   ├── api.py              # Job submit, list, status, result redirect
│   │   │   ├── service.py          # GenerationJob lifecycle management
│   │   │   ├── workers.py          # 10-step pipeline (profile → body class → template → Tripo → GLB → S3)
│   │   │   ├── body_classifier.py  # Classify body type from measurements
│   │   │   ├── orchestration.py    # Pipeline orchestration
│   │   │   └── schemas.py          # TryOnRequest, TryOnJobResponse, JobStatusResponse
│   │   ├── profiles/               # Profile + consent + GDPR
│   │   │   ├── api.py              # Profile CRUD, consent, GDPR erasure
│   │   │   ├── service.py          # Profile business logic
│   │   │   ├── domain.py           # Domain models
│   │   │   ├── policies.py         # Access policies
│   │   │   └── schemas.py          # Pydantic models
│   │   ├── templates/              # Template catalog + GLB delivery
│   │   │   ├── api.py              # List, get metadata, stream GLB
│   │   │   ├── service.py          # Template service
│   │   │   ├── selector.py         # Best template selection logic
│   │   │   └── schemas.py          # Template response models
│   │   ├── uploads/                # Dress image uploads
│   │   │   ├── api.py              # Upload, delete, presign
│   │   │   ├── service.py          # Upload service (EXIF strip, SHA-256 dedup)
│   │   │   └── schemas.py          # Upload request/response models
│   │   ├── consent/                # Consent domain logic
│   │   │   ├── api.py              # Consent endpoints
│   │   │   ├── service.py          # Consent recording
│   │   │   ├── domain.py           # Consent domain models
│   │   │   └── schemas.py          # Consent request/response models
│   │   └── prebake/                # Pre-bake template GLBs
│   │       ├── workers.py          # Prebake Celery tasks
│   │       └── service.py          # Prebake service
│   ├── infrastructure/             # Platform layer
│   │   ├── cache/                  # Redis cache service
│   │   │   ├── cache_service.py    # Get/set/delete, key builders, rate limiting
│   │   │   ├── keys.py             # Cache key conventions
│   │   │   └── redis.py            # Redis client initialization
│   │   ├── db/                     # Prisma client + repositories
│   │   │   ├── prisma.py           # Prisma client singleton
│   │   │   └── repositories/       # Data access layer
│   │   │       ├── dress_search_repo.py
│   │   │       ├── generation_job_repo.py
│   │   │       ├── template_repo.py
│   │   │       └── user_profile_repo.py
│   │   ├── external/               # External API clients
│   │   │   ├── tripo_client.py     # Tripo AI (submit, poll, download GLB)
│   │   │   ├── serper_client.py    # Serper Google Shopping
│   │   │   ├── scraper_api_client.py # ScraperAPI + JSON-LD extraction
│   │   │   ├── openrouter_client.py # OpenRouter embeddings
│   │   │   └── xai_client.py       # xAI/Grok client
│   │   ├── queue/                  # Celery configuration
│   │   │   ├── celery_app.py       # Celery app + Redis broker config
│   │   │   └── events.py           # Redis Pub/Sub for real-time updates
│   │   ├── storage/                # S3 + GLB handling
│   │   │   ├── s3.py               # Async S3 wrapper (upload, download, presign, purge)
│   │   │   ├── glb_loader.py       # GLB dispatcher (redis/s3/local/url)
│   │   │   └── local_storage.py    # Local file fallback (offline mode)
│   │   └── vectorstore/            # ChromaDB
│   │       └── chroma.py           # ChromaDB wrapper (embeddings, similarity search)
│   ├── schemas/                    # Shared Pydantic models
│   ├── shared/                     # Cross-cutting concerns
│   │   ├── security/               # Auth
│   │   │   ├── jwt.py              # JWT auth (shared with Express)
│   │   │   ├── api_key.py          # API key middleware
│   │   │   └── permissions.py      # Permission checks
│   │   ├── exceptions.py           # Custom exceptions
│   │   ├── responses.py            # Standard response helpers
│   │   └── utils/                  # Utilities
│   │       ├── files.py            # File utilities
│   │       ├── hashing.py          # Hashing utilities
│   │       └── time.py             # Time utilities
│   └── middleware/                 # HTTP middleware
│       └── audit_log.py            # Request logging (method, path, status, duration)
├── prisma/
│   ├── schema.prisma               # Database schema (shared with Express)
│   └── migrations/                 # Migration history
├── assets/                         # 3D GLB assets for dev/testing
│   ├── 3d-asset-1/                 # rp_posedplus character models (100k, 300k)
│   └── 3d-asset-2/                 # rp_posed character model
├── docker/                         # Docker configs
│   ├── app.Dockerfile              # API server image
│   └── worker.Dockerfile           # Celery worker image
├── scripts/                        # Utility scripts
│   ├── start.sh                    # Start all services
│   ├── dev_start.sh                # Dev mode start
│   ├── stop.sh                     # Stop services
│   ├── seed_templates.py           # Seed DressTemplate rows
│   ├── warm_cache.py               # Pre-warm Redis from S3
│   └── test.sh                     # Run tests
├── tests/                          # Test suite
│   ├── conftest.py                 # Pytest fixtures
│   ├── unit/                       # Unit tests
│   │   ├── dress_search/
│   │   ├── try_on/
│   │   ├── profiles/
│   │   ├── consent/
│   │   ├── infrastructure/
│   │   └── templates/
│   └── integration/                # Integration tests
│       ├── api/
│       ├── repositories/
│       └── workers/
├── logs/                           # Application logs
├── context.md                      # Original project spec (reference)
├── todo.md                         # Task tracking (see section 7)
├── MIGRATION.md                    # Refactor migration guide
├── pyproject.toml                  # Dependencies
├── requirements.txt                # Pinned versions
├── Dockerfile                      # Main Dockerfile
├── .env.example                    # Environment template
└── README.md                       # Project README
```

---

## 5. Database Schema (Key Models)

### Core Models (shared with Express)
- **User** — Core user accounts with OAuth support
- **Garment** — Garment catalog items with category, brand, tags, image URLs
- **ProcessingJob** — Generic job queue with status, retry logic, priority
- **TryonResult** — Try-on generation results with image URLs
- **AuditLog** — Audit trail for entity changes

### AI Server Specific Models
- **UserProfile** — Body measurements (height, chest, waist, hips, shoulders), t-shirt params (tHeight, tFullness), bodyLabel, ethnicity, gender, location, consent state, soft-delete for GDPR
- **DressTemplate** — Pre-baked 3D dress templates with GLB S3 keys, category, ethnicity, bodyLabel
- **GenerationJob** — Try-on/generation job tracking with Tripo task IDs, S3 keys for input/output, progress tracking, status (PENDING|PROCESSING|COMPLETED|FAILED)
- **ConsentRecord** — GDPR consent audit trail (consentType, granted, IP, userAgent, timestamp)
- **DressSearch** — User-initiated search sessions with LLM-parsed params, Celery task IDs, status
- **DressProduct** — Individual dress/product results linked to searches

### Body Type Inference
```
tHeight   [0,1]  → SHORT / AVERAGE / TALL
tFullness [0,1]  → SLIM  / AVERAGE / PLUS
bodyLabel = "{HEIGHT_LABEL}_{FULLNESS_LABEL}"
```

### Template Lookup Priority
1. Exact match: `ethnicity + bodyLabel`
2. Partial match: `bodyLabel` only (ethnicity = NULL/universal)
3. Universal fallback: `bodyLabel = NULL, ethnicity = NULL`

---

## 6. API Endpoints

### Dress Search
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/internal/ai/search-dresses` | API Key | Submit natural language dress search |
| WS | `/ws/status/{task_id}` | — | WebSocket for real-time job status |
| SSE | `/sse/status/{task_id}` | — | Server-Sent Events for job status |

### 3D Try-On
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/3d/try-on` | JWT | Submit try-on job |
| GET | `/api/3d/jobs` | JWT | List user's try-on jobs |
| GET | `/api/3d/jobs/{jobId}` | JWT | Poll job status |
| GET | `/api/3d/jobs/{jobId}/result` | JWT | Get result (302 redirect to presigned S3 URL) |

### Profile
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/profile/me` | JWT | Get own profile (sensitive fields masked without consent) |
| PUT | `/api/profile/me` | JWT | Update profile fields |
| DELETE | `/api/profile/me` | JWT | GDPR right to erase |

### Consent
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/profile/consent` | JWT | Record consent for sensitive fields |

### Templates
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/3d/templates` | — | List dress templates (paginated, filtered) |
| GET | `/api/3d/templates/{id}` | — | Get single template metadata |
| GET | `/api/3d/templates/{id}/glb` | — | Stream template GLB binary |

### Uploads
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/3d/upload/dress-image` | JWT | Upload dress image (EXIF strip, SHA-256 dedup) |
| DELETE | `/api/3d/upload/{s3Key}` | JWT | Delete uploaded image |

### Admin
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/health` | — | Health check |
| GET | `/api/admin/*` | Admin | Admin endpoints |

---

## 7. Caching Architecture

### Two-Layer Cache: Redis (L1) → S3 (L2)

```
┌─────────────────────────────────────────────────────┐
│  Layer 1: Redis (hot cache)                         │
│  Key patterns:                                      │
│    glb:base:{userId}                                │
│    glb:dress:template:{id}:{bodyLabel}              │
│    glb:dress:generated:{sha256}                     │
│    glb:result:{jobId}                               │
│    job:status:{jobId}                               │
│    tripo:rate:{userId} / tripo:rate:global          │
│  TTL: 1h (base models), 30min (dress), 24h (jobs)  │
│  Eviction: allkeys-lru                              │
└─────────────────────────────────────────────────────┘
          ↓ miss
┌─────────────────────────────────────────────────────┐
│  Layer 2: S3 (warm persistent cache)                │
│  Bucket structure:                                   │
│    avatars/{userId}/base.glb                         │
│    catalog/dresses/{dressId}/variants/{label}.glb   │
│    uploads/dresses/{userId}/{sha256}.jpg             │
│    results/try-on/{jobId}/dressed.glb               │
│  Lifecycle: auto-delete results after 30 days        │
└─────────────────────────────────────────────────────┘
```

### Cache Invalidation

| Trigger | Action |
|---|---|
| User deletes avatar | DEL `glb:base:{userId}` + S3 object delete |
| New dress template uploaded | DEL all `glb:dress:template:{id}:*` |
| GDPR delete | Purge all `glb:*:{userId}*` + S3 prefix delete |
| Tripo regenerates dress | DEL `glb:dress:generated:{sha256}` |
| Job TTL expires (24h) | Redis auto-expires `job:status:{jobId}` |

---

## 8. Celery Job Types

### 1. DRESS_SEARCH
- **Trigger:** POST `/internal/ai/search-dresses`
- **Pipeline:** LLM parse prompt → ChromaDB cache check → Serper Shopping → ScraperAPI enrichment → LLM formatting → PostgreSQL persist → Redis Pub/Sub broadcast
- **Result:** DressProduct records in DB, real-time via WebSocket/SSE

### 2. TRY_ON (3D Try-On)
- **Trigger:** POST `/api/3d/try-on`
- **Pipeline (10 steps):**
  1. Validate job & load profile
  2. Classify body type from measurements
  3. Select best dress template (3-tier lookup)
  4. Check GLB cache (Redis then S3)
  5. Call Tripo AI for generation
  6. Poll until complete, download GLB
  7. Cache result
  8. Upload to S3
  9. Mark job COMPLETED
- **Rate limits:** Per-user + global (configurable via Redis counters)
- **Result:** Presigned S3 URL (15-min TTL)

### 3. PREBAKE
- **Trigger:** Admin/manual
- **Purpose:** Pre-generate template GLB variants for ethnicity × bodyLabel grid
- **Result:** DressTemplate records with GLB S3 keys

---

## 9. Completion Status

### ✅ Completed Features

| Feature | Status | Details |
|---|---|---|
| **Project Bootstrap** | ✅ Done | FastAPI app, Prisma client, config, logging, health check, Docker, test scaffold |
| **API Key Security** | ✅ Done | `X-Internal-Api-Key` middleware, `checkApiKey` dependency |
| **LLM Integration** | ✅ Done | OpenRouter embeddings (text-embedding-3-small), xAI client stub, Anthropic SDK |
| **Web Search** | ✅ Done | Serper API client, Serper Shopping integration |
| **Web Scraping** | ✅ Done | ScraperAPI client with JSON-LD extraction, BeautifulSoup/lxml parsing |
| **ChromaDB Vector Store** | ✅ Done | Embedding pipeline, similarity search, `web_scrapes` collection |
| **Dress Search** | ✅ Done | Full pipeline: LLM parsing → ChromaDB cache → Serper → ScraperAPI → LLM format → persist → WebSocket/SSE streaming |
| **3D Try-On** | ✅ Done | Job submission, status polling, Tripo AI integration, 10-step Celery pipeline, S3 presigned URL delivery |
| **Profile Management** | ✅ Done | CRUD, body type classification, sensitive field masking |
| **Consent & GDPR** | ✅ Done | Consent recording with audit trail, right-to-erase (soft-delete + cache purge + S3 purge) |
| **Template Catalog** | ✅ Done | Paginated listing, filtering, GLB binary streaming (cache-first) |
| **Image Uploads** | ✅ Done | EXIF stripping, SHA-256 dedup, presigned URLs, ownership-enforced deletion |
| **Two-Layer Caching** | ✅ Done | Redis L1 + S3 L2 with graceful degradation |
| **Repository Pattern** | ✅ Done | DB access abstracted through repositories |
| **Module Architecture** | ✅ Done | Feature modules with api/service/schemas/workers pattern |
| **Legacy Compatibility** | ✅ Done | Re-export shims for old import paths |
| **Offline Mode** | ✅ Done | `OFFLINE_MODE` flag disables external APIs, uses local GLBs |
| **Real-Time Updates** | ✅ Done | WebSocket + SSE via Redis Pub/Sub |
| **Rate Limiting** | ✅ Done | Redis-backed per-user and global rate limits for Tripo AI |
| **Prebake System** | ✅ Done | Celery workers for pre-generating template variants |
| **3D Asset Pipeline** | ✅ Done | trimesh, pygltflib, pyrender, smplx, xatlas, open3d integration |

### ⚠️ Partially Complete / Needs Work

| Feature | Status | What's Missing |
|---|---|---|
| **API Key Coverage** | ⚠️ Partial | `checkApiKey` needs to be applied to ALL `/internal/ai/` routes; key rotation not implemented |
| **Audit Logging** | ⚠️ Partial | Middleware exists but needs verification it's writing to `AuditLog` Postgres table |
| **Structured LLM Output** | ⚠️ Partial | No `instructor` library integration yet; LLM output validation could be stricter |
| **LLM Provider Abstraction** | ⚠️ Partial | OpenRouter, xAI, Anthropic clients exist but no unified `BaseLLMClient` interface |
| **Prompt Versioning** | ⚠️ Partial | Prompts not yet extracted to dedicated `app/prompts/` directory |
| **Duplicate Detection** | ⚠️ Partial | Dress search needs upsert logic to avoid duplicate `DressProduct` records |
| **Scraping Rate Limits** | ⚠️ Partial | No exponential backoff for Serper/ScraperAPI 429 responses |
| **Fallback Dress Catalog** | ⚠️ Partial | No generic/default dress fallback when Serper + ScraperAPI both fail |
| **Garment Embeddings** | ⚠️ Partial | Embeddings not auto-generated when new `Garment` records are saved |
| **Vector Search Endpoint** | ⚠️ Partial | No `POST /internal/ai/vector-search` endpoint for Express to query ChromaDB |
| **Task De-duplication** | ⚠️ Partial | Same `(userId, dressId, scenePrompt)` combinations not yet de-duplicated |
| **S3 Presigned URLs** | ⚠️ Partial | Some endpoints return direct URLs instead of presigned URLs with TTL |

### ❌ Not Yet Started

| Feature | Priority | Notes |
|---|---|---|
| **Docker Compose GPU Profile** | Medium | `docker-compose.override.yml` with NVIDIA runtime for GPU workers |
| **Migration CI Step** | Medium | Automate `prisma db push` / `prisma generate` in startup/CI |
| **Celery GPU Worker Setup** | High | GPU-bound tasks (avatar generation, VTON) need GPU worker configuration |
| **Avatar Generation (PIFuHD/SMPL-X)** | High | `POST /internal/ai/avatar` endpoint + Celery task with 3D body estimation |
| **VTON Model Integration** | High | OOTDiffusion/HR-VITON integration for virtual try-on |
| **Stable Diffusion Background** | Medium | `diffusers` library integration for scene background generation |
| **Queue Position Tracking** | Low | Redis-backed queue position for Express polling |
| **Multi-angle Avatar Rendering** | Low | 360° preview frames from generated `.glb` |
| **Content Moderation** | Medium | NSFW classifier for uploaded images |
| **LangChain Agent** | Low | Replace direct LLM + Serper with autonomous LangChain agent |
| **Model Weight Caching** | Low | Cache AI model weights locally to avoid re-downloading on container restart |
| **Prometheus Metrics** | Low | `/metrics` endpoint for queue depth, task rates, GPU utilization |
| **GPU Worker Auto-scaling** | Low | K8s GPU node pool / AWS EC2 GPU auto-scaling documentation |
| **Outfit Style Transfer** | Low | Fine-tune VTON model on event-specific clothing categories |
| **Embedding Model Versioning** | Medium | Document model version, plan for migration |
| **Key Rotation Support** | Low | Comma-separated list of valid API keys for zero-downtime rotation |
| **80% Test Coverage** | Medium | `pytest-cov` configured but coverage not yet at target |

---

## 10. Running the Server

```bash
# Install dependencies
uv sync

# Generate Prisma client
uv run prisma generate --schema prisma/schema.prisma

# Run migrations
uv run prisma migrate dev --schema prisma/schema.prisma

# Start API server
uv run uvicorn app.main:app --reload --port 8888

# Start Celery worker (separate terminal)
uv run celery -A app.infrastructure.queue.celery_app worker -l INFO

# Run tests
uv run pytest

# Run tests with coverage
uv run pytest --cov=app --cov-report=term-missing

# Docker
docker build -t tryora-ai-server .
docker run -p 8888:8888 tryora-ai-server
```

---

## 11. Environment Variables

See `.env.example` for all required variables. Key variables:

| Variable | Description |
|---|---|
| `MASTER_APIKEY` | Server-to-server API key |
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `JWT_SECRET` | Shared JWT secret with Express backend |
| `SERPER_APIKEY` | Serper.dev API key |
| `TRIPO_API_KEY` | Tripo AI API key |
| `SCRAPER_API_KEY` | ScraperAPI key |
| `OPEN_ROUTER_APIKEY` | OpenRouter API key (embeddings) |
| `S3_BUCKET` | AWS S3 bucket name |
| `AWS_ACCESS_KEY_ID` | AWS credentials |
| `AWS_SECRET_ACCESS_KEY` | AWS credentials |
| `OFFLINE_MODE` | Disable external API calls (dev) |
| `CHROMADB_HOST` | ChromaDB host |
| `CHROMADB_PORT` | ChromaDB port |

---

## 12. Key Design Decisions

1. **Module-Based Architecture** — Each feature is self-contained with api/service/schemas/workers
2. **Async-First** — FastAPI is fully async; Celery workers wrap async in `asyncio.run()`
3. **Two-Layer Caching** — Redis (fast) + S3 (persistent) with graceful degradation
4. **Repository Pattern** — DB access abstracted through repositories
5. **Legacy Compatibility** — Re-export shims preserve old import paths during migration
6. **Event-Driven Real-Time** — WebSocket/SSE via Redis Pub/Sub bridges Celery workers to clients
7. **Offline Mode** — `OFFLINE_MODE` flag disables external APIs for dev/testing
8. **GDPR by Design** — Consent-gated sensitive fields, soft-delete, cache purge, audit trail

---

## 13. Known Issues & Technical Debt

1. **Legacy import shims** should be removed after all callers migrate to canonical paths
2. **`todo.md` and `context.md`** contain outdated information from pre-refactor state
3. **Test coverage** is below 80% target
4. **No GPU worker Dockerfile** — `worker.Dockerfile` exists but GPU dependencies not configured
5. **Prompt management** — LLM prompts are inline in code, not versioned separately
6. **No structured output enforcement** — LLM responses not validated against strict JSON schemas
7. **Rate limit backoff** — Serper/ScraperAPI 429 responses not handled with exponential backoff
