# Tryora — FastAPI AI Server TODO

> This file tracks module-level work for the AI backend (`ai-server`).
> Legend: `[x]` = Done · `[ ]` = Pending

---

## Module Breakdown (Granular)

> Priority labels: `P0` = critical path, `P1` = high impact, `P2` = polish/backlog.

### Module 1 (P0) — Platform & Runtime Foundation

- [x] FastAPI app entrypoint and router composition exist
- [x] Health endpoint includes DB and Redis readiness checks
- [x] Celery app is configured for async workers
- [x] Shared cache and storage abstractions are present
- [ ] Verify Docker Compose service wiring for API + worker + Redis + Postgres
- [ ] Add a startup validation script for required environment variables

### Module 2 (P0) — Avatar Pipeline (`app/modules/avatar`)

- [x] Avatar API routes exist (generate, status, result, me)
- [x] Avatar request/response schemas exist
- [x] Avatar worker pipeline exists
- [ ] Add stronger retry/backoff policy for external generation provider failures
- [ ] Add integration tests for avatar job lifecycle (queued -> processing -> done/failed)
- [ ] Add negative tests for invalid payloads and unauthorized access

### Module 3 (P0) — Profiles + Consent (`app/modules/profiles`, `app/modules/consent`)

- [x] Profile API routes and service layer exist
- [x] Profile repository/gateway adapters exist
- [x] Consent recording and GDPR erase service exist
- [ ] Add explicit consent-gating regression tests around profile updates
- [ ] Add cache invalidation tests for profile write operations
- [ ] Add contract tests for profile response fields

### Module 4 (P1) — Uploads (`app/modules/uploads`)

- [x] Upload API routes exist (upload, delete)
- [x] Upload validation and image handling logic exist
- [x] Upload service and schemas exist
- [ ] Add presigned URL flow tests and S3 failure-path tests
- [ ] Add content moderation hook before promoting uploads to downstream pipelines
- [ ] Add idempotency checks for repeated upload confirmations

### Module 5 (P0) — Dress Search (`app/modules/dress_search`)

- [x] Search API endpoint exists
- [x] WebSocket and SSE status streaming exist
- [x] Full Celery worker pipeline exists
- [x] Prompt parser, formatter, and query builder exist
- [x] Semantic cache path (Chroma + Redis broadcast) exists
- [ ] Add resilience tests for external provider outages/timeouts
- [ ] Add response-schema contract tests for clients

### Module 6 (P1) — Templates + Prebake (`app/modules/templates`, `app/modules/prebake`)

- [x] Template list/detail/GLB retrieval endpoints exist
- [x] Template selection logic exists
- [x] Prebake worker exists
- [x] Template GLB resolution service exists
- [ ] Add scheduled prebake trigger for popular templates
- [ ] Add prebake telemetry (duration, success rate, cache hit rate)
- [ ] Add regression tests for cache+S3 fallback behavior

### Module 7 (P0) — Try-On (`app/modules/try_on`)

- [x] Try-on module service and orchestration flow exist
- [x] Try-on worker exists
- [x] Body classifier and generation-router strategy logic exist
- [x] Try-on router is mounted in API composition
- [ ] Add end-to-end tests for try-on generation and status polling
- [ ] Tune timeout/retry policies for heavy generation jobs
- [ ] Add strict ownership checks in all result fetch paths

### Module 8 (P1) — Security & Internal Interfaces

- [x] Internal AI routes are guarded by API key dependency
- [x] Shared security primitives exist under `app/shared/security`
- [ ] Add per-endpoint abuse/rate-limiting policy where missing
- [ ] Add structured audit logs for destructive operations
- [ ] Add CI secret-scanning and dependency vulnerability checks
- [ ] Add explicit threat-model checklist for internal endpoints

### Module 9 (P2) — Testing & Quality Gates

- [ ] Define minimum unit test coverage target by module
- [ ] Add integration tests for avatar, uploads, and try-on paths
- [ ] Add stable fixtures for Prisma, Redis, and vector store dependencies
- [ ] Add smoke test script for local full-stack flow
- [ ] Enforce lint + type + test checks in CI pipeline

---

## Immediate Next Slice

- [ ] Complete Web Module 2 end-to-end (3-photo onboarding upload flow)
- [ ] Complete Server Module 3 minimal vertical slice (`/api/avatar/generate` + `/status`)
- [ ] Connect AI Module 2 avatar completion callback to API Gateway webhook flow
