# context.md — Tryora 3D Character Customization Backend

> **Scope:** FastAPI backend only. No frontend code.
> **Stack:** FastAPI · PostgreSQL (Prisma-managed) · Redis · AWS S3 · Tripo AI API
> **Deliverable:** Runnable skeleton — all files exist, core logic stubbed with TODO comments.
> **AI tooling:** VS Code + GitHub Copilot + Claude 4.6 (Sonnet)

---

## 1. Feature Goals

| Goal | Detail |
|---|---|
| Local-first 3D model customization | Serve cached base models and dress GLBs from Redis/S3 before calling any external API |
| Body-type-aware dress templates | Pre-built GLB templates per ethnicity × body-type grid (3×3 = 9 base variants per dress) |
| Offline-first cache | Two-layer cache: Redis (hot, in-memory) → S3 (warm, persistent). API only called on cache miss |
| Remote generation via Tripo AI | When no cached or template dress exists, call `tripo3d.ai` to generate a new GLB |
| GDPR consent & right to delete | Ethnicity and body-type data stored only after explicit consent; full deletion on request |

---

## 2. Tech Stack

```
FastAPI (Python 3.11+)          — async HTTP API, background tasks, dependency injection
PostgreSQL                      — user profiles, job state, consent records (existing Tryora DB)
Prisma (Python client)          — shared schema with Express backend (source of truth)
Redis                           — Layer-1 GLB cache, rate-limit counters, job dedup
AWS S3                          — Layer-2 GLB cache, user-uploaded dress images, final output storage
Tripo AI REST API               — remote 3D model generation (Bearer token auth)
Celery + Redis broker           — async generation jobs (reuses existing Tryora worker infra)
python-jose / passlib           — JWT auth (reuses existing Tryora auth tokens)
boto3                           — S3 client
httpx                           — async Tripo AI client
```

---

## 3. Data Model

### 3.1 PostgreSQL Tables (add to existing Prisma schema)

```prisma
// schema.prisma additions — append to existing Tryora schema

model UserProfile {
  id              String    @id @default(cuid())
  userId          String    @unique
  // Body measurements (from avatar pipeline — see 20-day guide)
  measHeight      Float?
  measChest       Float?
  measWaist       Float?
  measHips        Float?
  measShoulders   Float?
  tHeight         Float?    // normalized [0,1]
  tFullness       Float?    // normalized [0,1]
  bodyLabel       String?   // e.g. "TALL_AVERAGE"
  // Sensitive fields — only populated after consent
  ethnicity       String?   // NULL until consent granted
  gender          String?
  location        String?
  preferences     Json?     // {"style": ["boho"], "colors": ["earth"]}
  consentGiven    Boolean   @default(false)
  consentAt       DateTime?
  deletedAt       DateTime? // soft-delete for GDPR right-to-erase
  user            User      @relation(fields: [userId], references: [id])
}

model DressTemplate {
  id            String   @id @default(cuid())
  name          String
  category      String   // "maxi", "midi", "mini", "bodycon", "flowy"
  ethnicity     String?  // NULL = universal template
  bodyLabel     String?  // NULL = universal; else "TALL_SLIM", etc.
  glbS3Key      String   // S3 key for the pre-baked GLB
  thumbnailUrl  String?
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
}

model GenerationJob {
  id            String   @id @default(cuid())
  userId        String
  jobType       String   // "BASE_AVATAR" | "DRESS_FROM_IMAGE" | "DRESS_FROM_TEMPLATE"
  status        String   @default("PENDING") // PENDING|PROCESSING|COMPLETED|FAILED
  progress      Int      @default(0)
  currentStage  String?
  tripoTaskId   String?  // Tripo AI task ID for polling
  inputS3Key    String?  // uploaded dress image
  outputGlbS3Key String?
  outputGlbRedisKey String?
  errorMessage  String?
  createdAt     DateTime @default(now())
  completedAt   DateTime?
  user          User     @relation(fields: [userId], references: [id])
}

model ConsentRecord {
  id          String   @id @default(cuid())
  userId      String
  consentType String   // "ETHNICITY_DATA" | "IMAGE_PROCESSING" | "BODY_DATA"
  granted     Boolean
  ipAddress   String?
  userAgent   String?
  createdAt   DateTime @default(now())
  user        User     @relation(fields: [userId], references: [id])
}
```

### 3.2 Body Type Inference

Body type is inferred from avatar mesh measurements (extracted on Day 4 of the 20-day guide).
It is **never** inferred from ethnicity — they are independent fields.

```
tHeight   [0,1]  → SHORT / AVERAGE / TALL
tFullness [0,1]  → SLIM  / AVERAGE / PLUS
bodyLabel = "{HEIGHT_LABEL}_{FULLNESS_LABEL}"
```

Template lookup order:
1. Exact match: `ethnicity + bodyLabel`
2. Partial match: `bodyLabel` only (ethnicity = NULL/universal)
3. Universal fallback: `bodyLabel = NULL, ethnicity = NULL`

---

## 4. 3D Workflow

### 4.1 Startup: Base Model Loading

```
App startup
  └─ For each active user session:
       1. Check Redis: GET glb:base:{userId}
       2. Cache hit  → stream GLB from Redis → done
       3. Cache miss → Check S3: s3://tryora-assets/avatars/{userId}/base.glb
       4. S3 hit     → load → write-back to Redis (TTL 1h) → done
       5. Both miss  → check DB: avatars.glbS3Key exists?
                    → yes: trigger background S3→Redis warm-up job
                    → no:  return 404 (avatar not yet generated)
```

### 4.2 Dress Application

```
POST /api/3d/try-on
  Body: { avatarId, templateDressId?, userImageUrl?, scenePrompt? }

  ┌─ Path A: Template dress (fast path)
  │   1. Load DressTemplate from DB
  │   2. Check Redis: GET glb:dress:template:{templateDressId}:{bodyLabel}
  │   3. Hit  → return cached GLB key for rendering
  │   4. Miss → load from S3 → write-back to Redis → return
  │
  ├─ Path B: User-provided dress image (medium path)
  │   1. Validate user image already uploaded to S3 (inputS3Key)
  │   2. Check S3 hash cache: has this exact image been processed before?
  │   3. Hit  → return existing output GLB
  │   4. Miss → invoke Tripo AI (see 4.3) → queue Celery job → return jobId
  │
  └─ Path C: No match anywhere (slow path → Tripo AI)
      → same as Path B miss branch
```

### 4.3 Tripo AI Invocation

Called **only** when both cache layers miss and no matching template exists.

```
Trigger conditions:
  - User provides a dress image not previously processed
  - Admin requests a new template for an unsupported ethnicity/bodyLabel combo

Rate limits enforced:
  - Redis counter: tripo:rate:{userId} → max 10 calls/hour per user
  - Global counter: tripo:rate:global → max 500 calls/hour
  - On limit hit: return HTTP 429 with Retry-After header

Auth: Authorization: Bearer {TRIPO_API_KEY}  (from env var, never in code)

Endpoints used:
  POST https://api.tripo3d.ai/v2/openapi/task    — submit job
  GET  https://api.tripo3d.ai/v2/openapi/task/{id} — poll status

Fallback on Tripo failure:
  1. If task fails: select nearest template (body-label match, no ethnicity)
  2. If Tripo times out (>5 min): mark job FAILED, notify user, offer template fallback
  3. If Tripo returns 429: exponential backoff (1s, 2s, 4s, max 3 retries)
```

### 4.4 Local GLB Loading (Dev / Offline Mode)

When `TRIPO_API_KEY` is not set or `OFFLINE_MODE=true`, the backend loads GLBs from local disk.

```python
# app/services/glb_loader.py

async def load_glb(source: str) -> bytes:
    """
    source can be:
      - "redis:{key}"          → load from Redis
      - "s3:{bucket}/{key}"    → load from S3
      - "local:{/abs/path}"    → load from local disk (dev/offline mode)
      - "url:{https://...}"    → download from URL (Tripo CDN output)
    """
    # TODO: implement dispatch logic
    ...
```

---

## 5. Caching Architecture

### Two-Layer Cache: Redis → S3

```
┌─────────────────────────────────────────────────────┐
│  Layer 1: Redis (hot cache)                         │
│  Key pattern : glb:{type}:{id}:{variant}            │
│  TTL         : 1 hour (base models), 30 min (dress) │
│  Max memory  : set maxmemory-policy allkeys-lru      │
│  Eviction    : LRU (automatic via Redis policy)      │
└─────────────────────────────────────────────────────┘
         ↓ miss
┌─────────────────────────────────────────────────────┐
│  Layer 2: S3 (warm persistent cache)                │
│  Bucket structure:                                   │
│    avatars/{userId}/base.glb                         │
│    avatars/{userId}/measurements.json                │
│    catalog/dresses/{dressId}/variants/{label}.glb   │
│    uploads/dresses/{userId}/{sha256}.jpg             │
│    results/try-on/{jobId}/dressed.glb               │
│  Lifecycle: auto-delete results after 30 days        │
│  Eviction: S3 Lifecycle rules (not manual)           │
└─────────────────────────────────────────────────────┘
```

### Cache Key Conventions

```
glb:base:{userId}                     — user's base avatar
glb:dress:template:{id}:{bodyLabel}   — pre-baked template dress variant
glb:dress:generated:{sha256}          — generated dress (keyed by image hash)
glb:result:{jobId}                    — final dressed avatar output
tripo:rate:{userId}                   — rate limit counter (INCR + TTL 3600)
tripo:rate:global                     — global rate limit counter
job:status:{jobId}                    — job progress (TTL 24h)
```

### Cache Invalidation

| Trigger | Action |
|---|---|
| User deletes avatar | DEL `glb:base:{userId}` in Redis + S3 object delete |
| New dress template uploaded | DEL all `glb:dress:template:{id}:*` in Redis |
| User exercises GDPR delete right | Purge all `glb:*:{userId}*` keys + S3 prefix delete |
| Tripo regenerates a dress | DEL `glb:dress:generated:{sha256}` in Redis |
| Job TTL expires (24h) | Redis TTL auto-expires `job:status:{jobId}` |

---

## 6. API Endpoints

```
POST   /api/profile/consent          — record consent for sensitive fields
GET    /api/profile/me               — get own profile (no ethnicity if no consent)
PUT    /api/profile/me               — update profile fields
DELETE /api/profile/me               — GDPR right to erase (soft-delete + cache purge)

POST   /api/3d/avatar/generate       — trigger avatar generation from photos
GET    /api/3d/avatar/{avatarId}     — get avatar GLB (streams from cache)

GET    /api/3d/templates             — list dress templates (filtered by body type)
GET    /api/3d/templates/{id}/glb    — stream template GLB

POST   /api/3d/try-on                — submit try-on job
GET    /api/3d/jobs/{jobId}          — poll job status + progress
GET    /api/3d/jobs/{jobId}/result   — stream final GLB when COMPLETED

POST   /api/3d/upload/dress-image    — upload dress image to S3, returns S3 key
DELETE /api/3d/upload/{s3Key}        — delete uploaded image

GET    /api/admin/cache/stats        — Redis memory + key counts (admin only)
DELETE /api/admin/cache/flush        — flush specific cache key pattern (admin only)
```

---

## 7. Security & Privacy

### GDPR Compliance

```
Sensitive fields: ethnicity, gender, location, uploaded images
Storage rule:     NULL until ConsentRecord exists for that field type
Consent flow:
  1. User calls POST /api/profile/consent { consentType, granted: true }
  2. ConsentRecord created with IP + userAgent + timestamp
  3. Only then can the corresponding profile field be written

Right to erase (DELETE /api/profile/me):
  1. Soft-delete: UserProfile.deletedAt = now()
  2. Nullify sensitive fields immediately
  3. Queue background task: purge all S3 objects under uploads/dresses/{userId}/
  4. DEL all Redis keys matching glb:*:{userId}*
  5. ConsentRecords retained for audit (legal requirement) — personal data zeroed
  6. Response: 200 with deletion confirmation + ticket ID
```

### Image Handling

```
Upload validation:
  - Max file size: 10 MB
  - Accepted MIME types: image/jpeg, image/png, image/webp
  - No EXIF data retained (strip on upload)
  - S3 key includes SHA-256 of content for dedup and cache keying

Retention:
  - User uploads: 90 days (S3 Lifecycle rule)
  - Generated GLBs: 30 days
  - Job records: 1 year (for support/debugging)

Access control:
  - All S3 objects private (no public URLs)
  - Access via presigned URLs (15-min TTL) only
  - GLB streaming via FastAPI endpoint that validates JWT before generating presigned URL
```

### API Key Security

```python
# NEVER hardcode keys. Load exclusively from environment:
TRIPO_API_KEY = os.environ["TRIPO_API_KEY"]       # required
AWS_ACCESS_KEY_ID = os.environ["AWS_ACCESS_KEY_ID"]
AWS_SECRET_ACCESS_KEY = os.environ["AWS_SECRET_ACCESS_KEY"]
REDIS_URL = os.environ["REDIS_URL"]
DATABASE_URL = os.environ["DATABASE_URL"]
```

---

## 8. Folder Structure

```
tryora-fastapi/
├── app/
│   ├── main.py                     # FastAPI app factory, lifespan, middleware
│   ├── config.py                   # Settings (pydantic-settings, reads .env)
│   ├── dependencies.py             # Shared FastAPI deps: db, redis, current_user
│   │
│   ├── api/
│   │   ├── __init__.py
│   │   ├── profile.py              # /api/profile/* routes
│   │   ├── avatar.py               # /api/3d/avatar/* routes
│   │   ├── templates.py            # /api/3d/templates/* routes
│   │   ├── try_on.py               # /api/3d/try-on + jobs routes
│   │   ├── uploads.py              # /api/3d/upload/* routes
│   │   └── admin.py                # /api/admin/* routes
│   │
│   ├── services/
│   │   ├── glb_loader.py           # load_glb() dispatcher (redis/s3/local/url)
│   │   ├── cache.py                # CacheService: get/set/delete, key builders
│   │   ├── tripo_client.py         # async Tripo AI client (create_task, poll, download)
│   │   ├── s3_service.py           # upload, download, presign, delete, purge_prefix
│   │   ├── body_classifier.py      # classify body type from measurements
│   │   ├── template_selector.py    # pick best DressTemplate for a user
│   │   ├── consent_service.py      # consent recording, GDPR delete
│   │   └── job_service.py          # job lifecycle: create, update, poll
│   │
│   ├── workers/
│   │   ├── celery_app.py           # Celery app + Redis broker config
│   │   ├── try_on_task.py          # @shared_task: full 3D try-on pipeline
│   │   └── prebake_task.py         # @shared_task: catalog variant pre-baking
│   │
│   ├── models/
│   │   ├── profile.py              # Pydantic request/response schemas
│   │   ├── try_on.py               # TryOnRequest, TryOnJobResponse
│   │   ├── template.py             # DressTemplateResponse
│   │   └── job.py                  # JobStatus, JobProgress
│   │
│   ├── db/
│   │   ├── prisma_client.py        # Prisma async client singleton
│   │   └── queries/
│   │       ├── profile.py          # DB queries for UserProfile
│   │       ├── jobs.py             # DB queries for GenerationJob
│   │       └── templates.py        # DB queries for DressTemplate
│   │
│   └── middleware/
│       ├── auth.py                 # JWT validation (reuses Tryora tokens)
│       ├── rate_limit.py           # Redis-backed rate limiting per user
│       └── request_id.py          # X-Request-ID header injection
│
├── tests/
│   ├── conftest.py                 # pytest fixtures: test DB, mock Redis, mock S3
│   ├── test_profile.py
│   ├── test_try_on.py
│   ├── test_cache.py
│   ├── test_tripo_client.py
│   └── test_consent.py
│
├── scripts/
│   ├── seed_templates.py           # Load initial DressTemplate rows from CSV
│   └── warm_cache.py               # Pre-warm Redis from S3 for top N dresses
│
├── .env.example                    # All required env vars documented
├── requirements.txt
├── Dockerfile
├── docker-compose.yml              # FastAPI + Redis + (points to existing PG)
└── README.md
```

---

## 9. Core Snippet Examples

### 9.1 GLB Loader (dispatcher)

```python
# app/services/glb_loader.py
import asyncio, boto3, os
from enum import Enum
from app.services.cache import CacheService

class GlbSource(str, Enum):
    REDIS = "redis"
    S3    = "s3"
    LOCAL = "local"
    URL   = "url"

async def load_glb(source_uri: str, cache: CacheService) -> bytes:
    """
    source_uri examples:
      "redis:glb:base:user_abc"
      "s3:tryora-assets/avatars/user_abc/base.glb"
      "local:/data/glb/template_maxi_average.glb"
      "url:https://cdn.tripo3d.ai/output/xyz.glb"
    """
    scheme, path = source_uri.split(":", 1)
    source = GlbSource(scheme)

    if source == GlbSource.REDIS:
        # TODO: return await cache.get_bytes(path)
        ...

    elif source == GlbSource.S3:
        bucket, key = path.split("/", 1)
        # TODO: return await s3_service.download_bytes(bucket, key)
        ...

    elif source == GlbSource.LOCAL:
        # TODO: return open(path, "rb").read()
        # Used when OFFLINE_MODE=true or TRIPO_API_KEY not set
        ...

    elif source == GlbSource.URL:
        # TODO: async with httpx.AsyncClient() as c:
        #           r = await c.get(path); return r.content
        ...

    raise ValueError(f"Unknown GLB source scheme: {scheme}")
```

### 9.2 Cache Service

```python
# app/services/cache.py
import json
from typing import Optional
import redis.asyncio as aioredis

class CacheService:
    """
    Two-layer cache: Redis (L1) → S3 (L2).
    All methods async. S3 fallback handled by callers via load_glb().
    """

    def __init__(self, redis_client: aioredis.Redis):
        self.redis = redis_client

    # ── Key builders ──────────────────────────────────────────
    @staticmethod
    def key_base_avatar(user_id: str) -> str:
        return f"glb:base:{user_id}"

    @staticmethod
    def key_template_dress(template_id: str, body_label: str) -> str:
        return f"glb:dress:template:{template_id}:{body_label}"

    @staticmethod
    def key_generated_dress(image_sha256: str) -> str:
        return f"glb:dress:generated:{image_sha256}"

    @staticmethod
    def key_job_status(job_id: str) -> str:
        return f"job:status:{job_id}"

    @staticmethod
    def key_rate_limit(user_id: str) -> str:
        return f"tripo:rate:{user_id}"

    # ── GLB bytes ─────────────────────────────────────────────
    async def get_glb(self, key: str) -> Optional[bytes]:
        # TODO: return await self.redis.get(key)
        ...

    async def set_glb(self, key: str, data: bytes, ttl_seconds: int = 3600) -> None:
        # TODO: await self.redis.setex(key, ttl_seconds, data)
        ...

    async def delete(self, key: str) -> None:
        # TODO: await self.redis.delete(key)
        ...

    async def delete_pattern(self, pattern: str) -> int:
        """Delete all keys matching pattern. Returns count deleted."""
        # TODO: use SCAN + pipeline DELETE (never use KEYS in production)
        ...

    # ── Job status ────────────────────────────────────────────
    async def set_job_status(self, job_id: str, payload: dict) -> None:
        # TODO: await self.redis.setex(
        #           self.key_job_status(job_id), 86400, json.dumps(payload))
        ...

    async def get_job_status(self, job_id: str) -> Optional[dict]:
        # TODO: raw = await self.redis.get(self.key_job_status(job_id))
        #       return json.loads(raw) if raw else None
        ...

    # ── Rate limiting ─────────────────────────────────────────
    async def check_and_increment_rate(
        self, user_id: str, limit: int = 10, window_seconds: int = 3600
    ) -> tuple[bool, int]:
        """Returns (allowed, current_count)."""
        # TODO: use Redis INCR + EXPIRE pipeline
        # If key doesn't exist, INCR creates it at 1; set TTL on first call
        ...
```

### 9.3 Tripo AI Client

```python
# app/services/tripo_client.py
import asyncio, os
import httpx
from app.config import settings

TRIPO_BASE = "https://api.tripo3d.ai/v2/openapi"

class TripoClient:

    def __init__(self):
        self.headers = {
            "Authorization": f"Bearer {settings.TRIPO_API_KEY}",
            "Content-Type": "application/json",
        }

    async def image_to_3d(self, image_url: str) -> str:
        """Submit image-to-3D task. Returns task_id."""
        async with httpx.AsyncClient(timeout=30) as client:
            # TODO: POST to TRIPO_BASE/task with image_to_model payload
            # TODO: raise TripoAPIError on non-zero code
            ...

    async def poll_until_done(
        self, task_id: str, max_wait: int = 300, interval: int = 5
    ) -> dict:
        """Poll task until success/failure. Returns result dict."""
        async with httpx.AsyncClient(timeout=30) as client:
            deadline = asyncio.get_event_loop().time() + max_wait
            while asyncio.get_event_loop().time() < deadline:
                # TODO: GET TRIPO_BASE/task/{task_id}
                # TODO: check status field: success → return data
                #                           failed  → raise TripoTaskFailed
                #                           else    → await asyncio.sleep(interval)
                await asyncio.sleep(interval)
        raise TimeoutError(f"Tripo task {task_id} timed out after {max_wait}s")

    async def download_glb(self, glb_url: str) -> bytes:
        """Download generated GLB from Tripo CDN."""
        async with httpx.AsyncClient(timeout=120) as client:
            # TODO: r = await client.get(glb_url); return r.content
            ...


class TripoAPIError(Exception):
    pass

class TripoTaskFailed(Exception):
    pass
```

### 9.4 Template Selector

```python
# app/services/template_selector.py
from app.db.queries.templates import get_templates_for_body
from app.models.profile import UserProfile

async def select_best_template(
    user: UserProfile, category: str, db
) -> "DressTemplate | None":
    """
    Priority:
    1. ethnicity + bodyLabel exact match
    2. bodyLabel match (any ethnicity)
    3. universal (no ethnicity, no bodyLabel)
    Returns None if no template found → caller invokes Tripo AI.
    """
    if user.consent_given and user.ethnicity:
        # TODO: exact match query
        ...

    # TODO: body-label-only match query
    # TODO: universal fallback query
    # TODO: return None if nothing found
    ...
```

### 9.5 Consent Service (GDPR)

```python
# app/services/consent_service.py
from datetime import datetime
from app.db.prisma_client import get_prisma

async def record_consent(
    user_id: str, consent_type: str, granted: bool,
    ip_address: str, user_agent: str
) -> None:
    # TODO: prisma.consentrecord.create(...)
    # TODO: if granted and consent_type == "ETHNICITY_DATA":
    #           await prisma.userprofile.update(
    #               where={"userId": user_id},
    #               data={"consentGiven": True, "consentAt": datetime.utcnow()})
    ...

async def gdpr_erase(user_id: str, cache: "CacheService", s3: "S3Service") -> str:
    """
    Full right-to-erase flow. Returns deletion ticket ID.
    Steps:
      1. Soft-delete UserProfile (set deletedAt, zero sensitive fields)
      2. Purge Redis keys: glb:*:{user_id}*
      3. Delete S3 prefix: uploads/dresses/{user_id}/
      4. ConsentRecords: retain record existence, zero personal data fields
    """
    # TODO: implement all 4 steps
    # TODO: return ticket_id for user confirmation email
    ...
```

---

## 10. VS Code + Copilot + Claude Integration

### .vscode/settings.json

```json
{
  "editor.formatOnSave": true,
  "python.defaultInterpreterPath": "./venv/bin/python",
  "github.copilot.enable": { "*": true },
  "[python]": { "editor.defaultFormatter": "ms-python.black-formatter" }
}
```

### Copilot Prompt Strategy (in-file comments before each TODO)

Write the intent as a docstring or comment immediately above the `# TODO` line.
Copilot uses the surrounding context. Example pattern:

```python
async def set_glb(self, key: str, data: bytes, ttl_seconds: int = 3600) -> None:
    """Store GLB bytes in Redis with TTL. Key follows glb:{type}:{id} convention."""
    # TODO: await self.redis.setex(key, ttl_seconds, data)
    # ↑ Copilot will suggest the implementation from the docstring + TODO comment
```

### Claude 4.6 Sample Prompts

**Initial scaffolding prompt (paste into Claude with this context.md attached):**
```
You are building the FastAPI backend for Tryora's 3D character customization feature.
Read context.md for the full spec. Generate the skeleton implementation for:
  app/services/cache.py
Fill in all TODO stubs. Use redis.asyncio. Follow the key conventions in section 9.2.
Do not add any frontend code. Do not change the function signatures.
```

**Per-service completion prompt:**
```
Complete the TripoClient in app/services/tripo_client.py.
Use httpx.AsyncClient for all HTTP calls.
Raise TripoAPIError for non-zero API codes.
Raise TripoTaskFailed if task status is 'failed' or 'cancelled'.
Raise TimeoutError after max_wait seconds.
Include exponential backoff (1s, 2s, 4s) on HTTP 429 responses.
```

**GDPR delete prompt:**
```
Implement gdpr_erase() in app/services/consent_service.py.
It must: (1) soft-delete UserProfile, (2) zero ethnicity/gender/location fields,
(3) call cache.delete_pattern for the user's Redis keys,
(4) call s3.purge_prefix for uploads/dresses/{user_id}/,
(5) retain ConsentRecord rows but zero IP and userAgent fields,
(6) return a UUID ticket_id.
All steps must run in order. If any step fails, log the error and continue the others.
```

---

## 11. Running the Skeleton

```bash
# 1. Clone / create project
cd tryora-fastapi

# 2. Python env
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt

# 3. Environment
cp .env.example .env
# Fill in: TRIPO_API_KEY, DATABASE_URL, REDIS_URL, AWS_* vars

# 4. Prisma
prisma generate     # generates Python client from schema.prisma
prisma migrate dev  # applies new tables (UserProfile, DressTemplate, etc.)

# 5. Start services
docker-compose up -d redis   # Redis only (Postgres is existing Tryora instance)

# 6. Run FastAPI
uvicorn app.main:app --reload --port 8001

# 7. Run Celery worker
celery -A app.workers.celery_app worker -Q gpu_jobs,catalog -l INFO

# 8. Verify
curl http://localhost:8001/docs   # FastAPI auto-docs — all routes visible
```

---

## 12. Environment Variables (.env.example)

```env
# Tripo AI
TRIPO_API_KEY=your_tripo_api_key_here

# Database (reuse existing Tryora PostgreSQL)
DATABASE_URL=postgresql://user:pass@localhost:5432/tryora

# Redis
REDIS_URL=redis://localhost:6379/0

# AWS S3
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
S3_BUCKET=tryora-assets

# App
OFFLINE_MODE=false          # set true to bypass Tripo API, use local GLBs
LOCAL_GLB_DIR=/data/glb     # path to local GLB files when OFFLINE_MODE=true
JWT_SECRET=                 # same secret as Express backend
MAX_TRIPO_CALLS_PER_USER=10
MAX_TRIPO_CALLS_GLOBAL=500
TRIPO_RATE_WINDOW_SECONDS=3600
```
