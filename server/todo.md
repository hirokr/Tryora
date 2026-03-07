# Tryora — Express.js API Gateway TODO

> This file tracks all backend tasks for the Express.js server, which acts as the **API Gateway & Orchestrator** between Next.js, Redis, PostgreSQL, and the FastAPI AI server.
> Legend: `[x]` = Done · `[ ]` = Pending

---

## Phase 0 — Project Bootstrap & Infrastructure

- [x] **Initialize Node.js / TypeScript project** — `package.json`, `tsconfig.json`, `eslint.config.js`, `nodemon.json` set up
- [x] **Environment variable management** — `.env`, `.env.example`, and `scripts/env.sh` created; critical secrets (DB URL, JWT secret, Redis URL, Google OAuth creds) are externalized
- [x] **Dockerfile** — Production-ready Dockerfile written
- [x] **Logging** — Structured logger configured in `src/config/logger.ts`
- [x] **Database connection** — Prisma ORM wired up via `src/config/database.ts`; `prisma/schema.prisma` defines all models (User, RefreshToken, ProcessingJob, Garment, TryonResult, AuditLog, etc.)
- [x] **Prisma migrations** — Multiple migrations applied (init → auth_done → latest); seed script at `prisma/seed.ts`
- [x] **Redis client** — Client initialized in `src/app.ts`, utility helpers in `src/utils/redis.ts` (`getSetCache`, `setCache`, `invalidateCache`)
- [x] **Arcjet rate-limiting integration** — `src/config/arcjet.ts` configured for request protection
- [x] **Swagger / OpenAPI docs** — Auto-generated Swagger UI available; schemas and security defined under `src/docs/swagger/`
- [x] **Jest test suite** — `jest.config.mjs` configured; coverage reports output to `coverage/`
- [ ] **Docker Compose networking** — Verify that `docker-compose.yml` links Express, PostgreSQL, and Redis containers correctly with health checks

---

## Phase 1 — Authentication & User Management (`/api/auth`, `/api/users`)

### 1.1 Authentication Routes (Express ↔ Client)

- [x] **POST `/api/auth/signup`** — Create user with hashed password (bcrypt), send verification email via Nodemailer
- [x] **POST `/api/auth/signin`** — Validate credentials, generate signed JWT access token + refresh token, set `HttpOnly` cookies, cache session in Redis
- [x] **POST `/api/auth/signout`** — Revoke refresh token from DB, invalidate Redis session cache, clear cookies
- [x] **POST `/api/auth/refresh`** — Verify refresh token, rotate tokens (old token deleted, new one saved), handle refresh token race condition (_TODO comment exists in code_)
- [x] **GET `/api/auth/google`** — Initiate Google OAuth2 flow via Passport.js
- [x] **GET `/api/auth/google/callback`** — Handle OAuth callback, generate tokens, redirect to frontend
- [x] **GET `/api/auth/google/failure`** — Handle OAuth failure redirect
- [ ] **Fix refresh token race condition** — Concurrent requests with the same refresh token must be handled atomically (Redis lock or DB-level unique constraint)

### 1.2 User Routes (`/api/users`)

- [x] **GET `/api/users/profile`** (`authMiddleware` protected) — Return current user profile
- [x] **PATCH `/api/users/profile`** — Update user name/preferences
- [x] **DELETE `/api/users/delete-account`** — Soft or hard delete user, purge refresh tokens
- [x] **POST `/api/users/forgot-password`** — Generate password reset token, send email with reset link
- [x] **POST `/api/users/reset-password`** — Verify reset token, hash and save new password
- [x] **POST `/api/users/verify-email`** — Mark account as verified via email token
- [x] **POST `/api/users/resend-verification-email`** — Throttled resend of verification email
- [x] **POST `/api/users/change-password`** — Authenticated password change (verify old + set new)
- [ ] **GET `/api/users/me`** — Canonical endpoint per API Gateway spec; currently only `/profile` exists; add alias or rename for consistency
- [ ] **PUT `/api/users/me`** — Canonical update endpoint per spec; make sure `preferences` field is properly saved to DB

### 1.3 Authentication Middleware & Utilities

- [x] **`authenticate.middleware.ts`** — JWT verification + Redis session validation middleware
- [x] **JWT utilities** — `src/utils/jwt/tokens.ts` — generate, verify, hash (HMAC-SHA256 via `crypto`) access & refresh tokens
- [x] **Password hashing** — `src/utils/auth/hash.ts` using bcrypt
- [x] **Email service** — `src/utils/mail/sendMail.ts` + Nodemailer config for verification & password reset emails
- [x] **Zod validation** — `auth.validation.ts`, `user.validation.ts` — schema validation on all incoming request bodies
- [ ] **Rate limit sign-in endpoint** — Apply Arcjet or express-rate-limit to prevent brute-force attacks on `/api/auth/signin`
- [ ] **Audit logging middleware** — Hook into user write operations (register, delete, update) to write `AuditLog` rows in Postgres

---

## Phase 2 — Avatar 3D Generation (`/api/avatar`)

- [ ] **POST `/api/avatar/generate`**
  - Accept `FormData` with `front`, `side`, `back` image files (3 photos)
  - Validate file types (JPEG/PNG only) and max size (e.g., 20 MB per image)
  - Upload the 3 images to **AWS S3 / GCS** via a storage utility
  - Call `POST /internal/ai/avatar` on FastAPI with `{ userId, images: [url1, url2, url3] }`
  - Create a `ProcessingJob` record in Postgres with status `"queued"` and the returned `jobId`
  - Return `202 Accepted { jobId }` to client
- [ ] **GET `/api/avatar/status/:jobId`**
  - Auth-protected; verify the job belongs to the requesting user
  - Query the `ProcessingJob` table for the given `jobId`
  - Return `{ status: "processing" }` or `{ status: "completed", modelUrl: "s3://..." }`
- [ ] **GET `/api/avatar/me`**
  - Return the user's completed `.glb` model URL from the `User` or `ProcessingJob` table
  - If none exists, return `404 { message: "No avatar found. Please generate one." }`
- [ ] **S3/GCS upload utility** — Create `src/utils/storage.ts` with `uploadFile(buffer, key)` and `getSignedUrl(key)` functions using the AWS SDK or GCS client
- [ ] **Webhook handler for avatar completion** — `POST /api/webhooks/ai-complete` — FastAPI/Celery calls this endpoint when GPU processing finishes; update `ProcessingJob` status and `modelUrl` in DB

---

## Phase 3 — Dress Discovery (`/api/discovery`)

- [ ] **POST `/api/discovery/search`**
  - Validate that `prompt` is a non-empty string (max ~500 chars)
  - Generate a **Redis cache key** by hashing the normalized prompt (e.g., lowercase + trimmed)
  - Check Redis for cached results with `getSetCache(cacheKey, ...)`
  - **Cache Hit:** Return cached dress array instantly
  - **Cache Miss:** Forward `{ prompt }` to `POST /internal/ai/scrape` on FastAPI
  - Receive parsed dress array from FastAPI; save to Postgres `Garment` table
  - Store result in Redis with a 24-hour TTL (`DEFAULT_EXPIRATION`)
  - Return dress array `[ { dressId, name, imageUrl, storeLink, price } ]`
- [ ] **POST `/api/discovery/save`**
  - Auth-protected
  - Validate `dressId` exists in Postgres `Garment` table
  - Create a user-garment association record (favorites/wishlist)
  - Return `{ success: true }`
- [ ] **GET `/api/discovery/saved`**
  - Auth-protected
  - Return all dresses saved by the current user (for PWA offline IndexedDB sync)
  - Include full dress data: name, imageUrl, storeLink, price
- [ ] **Cache invalidation strategy** — Implement a mechanism to bust stale search caches after 24 hours; consider cache versioning for breaking changes

---

## Phase 4 — Virtual Try-On (`/api/try-on`)

- [ ] **POST `/api/try-on/generate`**
  - Auth-protected; check user rate limit (max N requests/minute via Arcjet)
  - Validate `dressId` exists and `scenePrompt` is non-empty (max 300 chars)
  - Fetch user's avatar URL from DB; if none, return `400 { message: "No avatar found. Generate your avatar first." }`
  - Fetch dress image URL from `Garment` table by `dressId`
  - Call `POST /internal/ai/try-on` on FastAPI with `{ userId, avatarUrl, dressImageUrl, scenePrompt }`
  - Create a `ProcessingJob` record in Postgres with status `"queued"` and `jobId`
  - Return `202 Accepted { jobId }`
- [ ] **GET `/api/try-on/status/:jobId`**
  - Auth-protected; verify job ownership
  - Query `ProcessingJob` table for status
  - If completed, include queue position estimation in response for better UX
  - Return `{ status, resultUrl?, estimatedPosition? }`
- [ ] **GET `/api/try-on/history`**
  - Auth-protected
  - Return all completed `TryonResult` records for the current user with `resultUrl` and `originalDressLink`
  - Support pagination (query params `?page=1&limit=20`)
- [ ] **DELETE `/api/try-on/:id`**
  - Auth-protected; verify the try-on result belongs to the requesting user
  - Delete from `TryonResult` table; optionally delete from S3
  - Return `{ success: true }`

---

## Phase 5 — Redis Caching (Dress Search)

- [x] **Redis client setup** — `redisClient` initialized in `src/app.ts`
- [x] **`getSetCache` utility** — Generic cache-aside pattern function implemented in `src/utils/redis.ts`
- [x] **`setCache` / `invalidateCache` utilities** — Session cache helpers implemented
- [ ] **Search-specific cache middleware** — Create a dedicated Express middleware (`cacheSearch.middleware.ts`) that auto-checks Redis before routing to `/api/discovery/search` handler
- [ ] **Cache TTL configuration** — Ensure `REDIS_DEFAULT_EXPIRATION` env var is set to `86400` (24 hours) for dress search data; document in `.env.example`
- [ ] **Cache key normalization** — Build a deterministic cache-key function for search prompts: normalize whitespace, lowercase, sort JSON keys before hashing

---

## Phase 6 — Webhooks & Async Job Completion

- [ ] **POST `/api/webhooks/ai-complete`**
  - Internal route; validate incoming requests with a shared secret (`X-Webhook-Secret` header) to prevent spoofing
  - Parse payload `{ jobId, status, resultUrl? }`
  - Update `ProcessingJob` record in Postgres
  - If WebSocket server is running: push real-time update to the connected client
- [ ] **Job polling fallback** — Confirm that Express can query `ProcessingJob` status on demand without needing the webhook (database polling strategy as fallback)
- [ ] **WebSockets (optional enhancement)** — Integrate `socket.io` or native `ws` to push job completion events instead of relying solely on client polling

---

## Phase 7 — Security & Production Hardening

- [x] **Arcjet integration** — Request protection (bot detection, rate limiting) in `src/config/arcjet.ts`
- [x] **CORS configured** — Cross-origin requests restricted to known frontend origins
- [x] **HttpOnly cookie tokens** — Refresh tokens stored in `HttpOnly; Secure; SameSite=Strict` cookies
- [x] **Password hashing** — bcrypt with a sufficient work factor
- [x] **JWT validation** — Tokens verified on every protected route via middleware
- [ ] **Input sanitization** — Strip HTML/script tags from all user-supplied text fields (especially `scenePrompt`) to prevent stored XSS
- [ ] **SQL injection protection** — Review all raw Prisma queries; always use parameterized queries (Prisma handles this by default — verify no raw query calls use string interpolation)
- [ ] **Helmet.js** — Add `helmet()` middleware for HTTP security headers (CSP, HSTS, X-Frame-Options, etc.)
- [ ] **API key rotation** — Implement a mechanism to rotate the shared secret used for FastAPI ↔ Express internal communication
- [ ] **Secrets scanning** — Add a `pre-commit` hook or CI step to prevent committing secrets to the repo

---

## Phase 8 — Testing

- [x] **Jest configured** — `jest.config.mjs` set up with coverage reporting
- [x] **Auth tests** — `tests/auth.test.ts` written
- [x] **User tests** — `tests/user.test.ts` written
- [ ] **Avatar route tests** — Integration tests for `/api/avatar/generate`, `/status/:jobId`, and `/me`
- [ ] **Discovery route tests** — Test cache hit and cache miss paths for `/api/discovery/search`
- [ ] **Try-on route tests** — Test job creation, polling, history, and delete for `/api/try-on`
- [ ] **Redis mock** — Use `ioredis-mock` or Jest mocks to isolate Redis in tests
- [ ] **S3 upload mock** — Mock AWS SDK calls in upload tests to avoid hitting real buckets
- [ ] **Reach 80% code coverage** — Current coverage measured; target 80%+ across branches and lines

---

## Phase 9 — Proxy Routes to FastAPI (Internal Communication)

- [ ] **Create `src/services/aiService.ts`** — Centralized HTTP client (using `axios` or `undici`) for all calls from Express to FastAPI
  - `callAvatarGeneration(userId, imageUrls)` → `POST /internal/ai/avatar`
  - `callScrape(prompt)` → `POST /internal/ai/scrape`
  - `callTryOn(userId, avatarUrl, dressImageUrl, scenePrompt)` → `POST /internal/ai/try-on`
- [ ] **Internal API authentication** — All requests from Express to FastAPI must include an `X-Internal-Api-Key` header validated by FastAPI's `secure_keys` middleware
- [ ] **Retry logic & circuit breaker** — Add exponential backoff on transient 5xx errors from FastAPI; circuit-break after N consecutive failures to prevent cascade

---

## Backlog / Future Work

- [ ] **Recommendation engine routes** — `GET /api/recommendations` — fetch LLM-personalized outfit suggestions based on `RecommendationLog` history
- [ ] **Outfit management** — CRUD for `Outfit` and `OutfitItem` models (save outfits, share them, export look as PDF)
- [ ] **Event management** — `POST /api/events` — allow users to save named events with scene prompts
- [ ] **Content moderation** — Route uploaded images through a content moderation check before passing to AI (uses `ContentModeration` Prisma model)
- [ ] **System metrics endpoint** — `GET /api/admin/metrics` — expose CPU/GPU queue depth, job success rate, Redis hit rate for monitoring
- [ ] **OpenAPI spec export** — Auto-export the Swagger spec to a static `openapi.json` file on CI for frontend SDK generation
