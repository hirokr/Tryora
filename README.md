# Tryora — AI-Powered 3D Virtual Try-On Platform

**Tryora** is a production-grade, distributed web application that lets users generate a photorealistic 3D avatar of themselves, discover clothing through AI-driven search, and virtually try on outfits in AI-generated background scenes — all from the browser, including offline via PWA.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Core Features](#core-features)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Variables](#environment-variables)
  - [Running with Docker](#running-with-docker)
  - [Running Locally](#running-locally)
- [Services](#services)
  - [Web (Next.js)](#web-nextjs)
  - [Server (Express.js)](#server-expressjs)
  - [AI Server (FastAPI)](#ai-server-fastapi)
- [Database](#database)
- [Offline & PWA](#offline--pwa)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Contributing](#contributing)

---

## Overview

Tryora solves a core problem in online fashion: shoppers cannot tell how a garment will look on their body before buying. The platform tackles this by combining:

- **3D avatar generation** from user-submitted photos
- **LLM-powered dress discovery** that understands natural language event queries
- **Virtual try-on (VTON) and AI scene generation** that composites the user's avatar with a selected dress in a generated background
- **Progressive Web App (PWA) support** for offline access to saved dresses and generated scenes

Because the AI and 3D generation pipeline involves GPU-bound tasks that can take 10–60 seconds, the system is built on an **asynchronous microservices architecture** with a Redis-backed job queue. No long-polling connections are held open; clients poll a lightweight job-status endpoint until their result is ready.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│  Browser (Next.js PWA)                                           │
│  Service Worker · Cache API · IndexedDB                          │
└────────────────────┬─────────────────────────────────────────────┘
                     │ HTTPS
┌────────────────────▼─────────────────────────────────────────────┐
│  Express.js  (API Gateway & Orchestrator)   :8000                │
│  Auth · Session · Rate-limiting · Swagger · Redis cache check    │
└──────────┬──────────────────────────┬────────────────────────────┘
           │ SQL (Prisma)             │ HTTP / Job dispatch
┌──────────▼───────────┐   ┌──────────▼──────────────────────────┐ │
│  PostgreSQL 16       │   │  FastAPI  (AI & Scraping Engine)    │ │
│                      │   │  :8888                              │ │
└──────────────────────┘   │  LLM · Serper · CrewAI · ChromaDB   │ │
                           └──────┬──────────────────────────────┘ │
┌──────────────────────┐          │ Celery tasks                   │
│  Redis 7              ◄─────────┘                                │
│  Cache + Job Queue    │                                          │
└──────────────────────┘                                           │
                                                                   │
┌──────────────────────────────────────────────────────────────────┘
│  AWS S3 / Compatible Object Storage                              |      
│  User photos · .glb / .gltf models · Generated scene images      |   
└──────────────────────────────────────────────────────────────────┘
```

**Key design decisions:**

| Decision                          | Rationale                                                                         |
| --------------------------------- | --------------------------------------------------------------------------------- |
| Express as the single API Gateway | Next.js talks to one surface; Express handles auth, caching, and routing          |
| Async job queue (Redis + Celery)  | GPU tasks are 10–60s; queuing prevents timeouts and server crashes under load     |
| Shared Prisma schema              | Both Node and Python clients generated from one `schema.prisma` — no schema drift |
| Redis dual-purpose                | Acts as both LRU cache for dress searches and FIFO broker for Celery jobs         |
| PWA offline layer                 | Service Worker + IndexedDB lets users browse their wardrobe without internet      |

---

## Tech Stack

| Layer          | Technology                                      | Version            |
| -------------- | ----------------------------------------------- | ------------------ |
| Frontend       | Next.js, React, TypeScript                      | Next 16 · React 19 |
| 3D Viewer      | Three.js, React Three Fiber / Drei              | three ^0.183       |
| Styling        | Tailwind CSS, shadcn/ui, Radix UI               | —                  |
| Animation      | GSAP                                            | ^3.14              |
| State          | Zustand                                         | ^5                 |
| File Upload    | UploadThing                                     | ^7                 |
| API Gateway    | Express.js, TypeScript                          | v5                 |
| Auth           | Passport.js (Google OAuth2), jose (JWT), Argon2 | —                  |
| Security       | Arcjet, Helmet                                  | —                  |
| Logging        | Winston, Morgan                                 | —                  |
| ORM            | Prisma                                          | ^7                 |
| AI Engine      | FastAPI, Python                                 | ^0.129 / 3.13+     |
| Task Queue     | Celery                                          | —                  |
| LLM            | OpenAI / xAI SDK                                | —                  |
| AI Agents      | CrewAI                                          | ^0.95              |
| Vector DB      | ChromaDB                                        | ^1.5               |
| Cache / Broker | Redis                                           | 7 Alpine           |
| Database       | PostgreSQL                                      | 16 Alpine          |
| Containers     | Docker, Docker Compose                          | —                  |

---

## Core Features

### Feature A — 3D Avatar Generation

1. User uploads front, side, and back photos via the Next.js UI.
2. Express saves the images to S3 and enqueues an `AVATAR_GENERATION` job in Redis. A `jobId` is returned immediately (`202 Accepted`).
3. A Celery worker picks up the job, runs the 3D reconstruction model, saves the resulting `.glb` file to S3, and marks the job `COMPLETED` in PostgreSQL.
4. Next.js polls Express until the job is done, then streams and renders the model via React Three Fiber.

### Feature B — AI-Driven Dress Discovery

1. User submits a natural-language query (e.g., _"beach wedding dress"_).
2. FastAPI passes the prompt to an LLM which extracts structured search parameters:
   ```json
   {
   	"style": "floral, light, maxi",
   	"event": "beach wedding",
   	"colors": ["yellow", "light blue"]
   }
   ```
3. Express checks Redis for a cached result matching those parameters.
   - **Cache hit** → return immediately.
   - **Cache miss** → FastAPI queries PostgreSQL; if empty, scrapes Google via the Serper API, saves results to S3 + PostgreSQL, and caches the response in Redis.

### Feature C — Virtual Try-On & Scene Generation

1. User picks their avatar, a dress, and enters a scene prompt (e.g., _"sunset by the ocean"_).
2. Express enqueues a `TRY_ON_SCENE` job and returns a `jobId`.
3. A Celery worker downloads the 3D model and dress image from S3, runs the VTON pipeline and a Stable Diffusion background generator, saves the composite image to S3, and updates the job status.
4. Next.js retrieves the final image URL and the original store purchase link.

### Feature D — Offline PWA

| Mechanism                  | What it caches                                 | How                                              |
| -------------------------- | ---------------------------------------------- | ------------------------------------------------ |
| Service Worker + Cache API | `.glb` / `.gltf` 3D model files (5–20 MB)      | Intercepts fetch; serves from cache when offline |
| IndexedDB                  | Dress catalog JSON, saved favorites            | Written on browse/favorite; read offline         |
| Background Sync            | Queued mutations (e.g., delete saved dress)    | Replayed silently when device reconnects         |
| Optimistic UI              | Instant UI feedback before server confirmation | State update precedes API call                   |

---

## Project Structure

```
tryora/
├── web/                   # Next.js frontend (PWA)
│   ├── app/               # App Router pages & layouts
│   ├── components/        # Shared UI components
│   ├── providers/         # Context providers (auth, theme, GSAP)
│   ├── store/             # Zustand state slices
│   ├── hooks/             # Custom React hooks
│   └── lib/               # Auth helpers, utilities
│
├── server/                # Express.js API Gateway
│   ├── src/
│   │   ├── controllers/   # Route handlers
│   │   ├── services/      # Business logic
│   │   ├── middlewares/   # Auth, rate-limiting, error handling
│   │   ├── routes/        # Route definitions
│   │   ├── validations/   # Zod schemas
│   │   └── utils/         # Shared utilities
│   ├── prisma/
│   │   └── schema.prisma  # Single source of truth for all DB models
│   └── tests/
│
├── ai-server/             # FastAPI AI & scraping engine
│   ├── app/
│   │   ├── api/           # Route handlers (v1)
│   │   ├── core/          # Config, logger
│   │   ├── db/            # Prisma + vector DB connections
│   │   ├── domains/       # Feature domains (avatar, VTON, discovery)
│   │   ├── LLM/           # LLM wrappers, structured output
│   │   ├── schemas/       # Pydantic models
│   │   └── worker/        # Celery task definitions
│   └── tests/
│
└── docker-compose.yml     # Full-stack orchestration
```

---

## Getting Started

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose v2
- Node.js 20+ and pnpm/npm (for local development without Docker)
- Python 3.13+ and [uv](https://github.com/astral-sh/uv) (for local AI server development)
- An AWS S3 bucket (or compatible, e.g. MinIO for local development)
- API keys: OpenAI or xAI, Serper

### Environment Variables

Copy and populate the environment files for each service before starting:

```bash
# API Gateway
cp server/scripts/env.sh.example server/scripts/env.sh

# Web
cp web/scripts/env.sh.example web/scripts/env.sh
```

**Core variables required:**

| Variable                                                        | Service           | Description                  |
| --------------------------------------------------------------- | ----------------- | ---------------------------- |
| `DATABASE_URL_LOCAL`                                            | server            | PostgreSQL connection string |
| `REDIS_URL`                                                     | server            | Redis connection string      |
| `SESSION_SECRET_KEY`                                            | server, web       | Session signing secret       |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`                     | server            | Google OAuth2 credentials    |
| `OPENAI_API_KEY` or `XAI_API_KEY`                               | ai-server         | LLM provider key             |
| `SERPER_API_KEY`                                                | ai-server         | Google Search scraping API   |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_S3_BUCKET` | server, ai-server | Object storage               |
| `BACKEND_URL`                                                   | web               | Express server URL           |
| `AI_SERVER_URL`                                                 | web, server       | FastAPI server URL           |

### Running with Docker

```bash
# Create the shared Docker network (first time only)
docker network create Tryora-network

# Build and start all services
docker compose up --build
```

Services will be available at:

| Service               | URL                   |
| --------------------- | --------------------- |
| Web (Next.js)         | http://localhost:3000 |
| API Gateway (Express) | http://localhost:8000 |
| AI Server (FastAPI)   | http://localhost:8888 |
| PostgreSQL            | localhost:5433        |
| Redis                 | localhost:6379        |

### Running Locally

**API Gateway (server/)**

```bash
cd server
npm install
npm run db:gen        # Generate Prisma client
npm run db:migrate    # Run migrations
npm run dev           # Start with nodemon
```

**Web (web/)**

```bash
cd web
npm install
npm run dev
```

**AI Server (ai-server/)**

```bash
cd ai-server
uv sync               # Install Python dependencies
source .venv/bin/activate
bash scripts/start.sh
```

---

## Services

### Web (Next.js)

- **Port:** 3000
- App Router with TypeScript and Tailwind CSS
- 3D model viewer via React Three Fiber and `@react-three/drei`
- PWA with Service Worker for offline support
- File uploads via UploadThing
- Authentication state managed through NextAuth-compatible session providers

### Server (Express.js)

- **Port:** 8000
- Acts as the sole API Gateway — Next.js does not call FastAPI directly
- JWT and session-based authentication via Passport.js
- Rate limiting and bot protection via Arcjet
- Redis-backed job dispatch and dress-search caching
- Swagger UI available at `/api-docs`
- Structured logging with Winston

### AI Server (FastAPI)

- **Port:** 8888
- Handles all GPU-bound and Python-native tasks
- LLM integration (OpenAI / xAI) with structured JSON output via Pydantic
- AI agent orchestration via CrewAI
- Vector search via ChromaDB
- Web scraping via Serper API
- Background task processing via Celery workers consuming from Redis

---

## Database

Tryora uses a **single `schema.prisma`** file located in `server/prisma/` to generate both the Node.js Prisma client (for Express) and the Python Prisma client (for FastAPI). This ensures both services operate on an identical, type-safe schema.

**Core models:**

| Model            | Purpose                                                                                           |
| ---------------- | ------------------------------------------------------------------------------------------------- |
| `User`           | Authentication, profile                                                                           |
| `Avatar`         | S3 references for uploaded photos and generated `.glb` model                                      |
| `Dress`          | Global catalog of scraped dresses (deduplication key)                                             |
| `UserSavedDress` | Join table for user favorites (synced to IndexedDB)                                               |
| `AiJob`          | Central job tracker: type, status (`PENDING` → `PROCESSING` → `COMPLETED` / `FAILED`), result URL |
| `GeneratedScene` | User's gallery of completed VTON composite images                                                 |

```bash
# Run migrations
cd server && npm run db:migrate

# Open Prisma Studio
cd server && npm run db:studio
```

---

## Offline & PWA

The Service Worker intercepts all fetch calls for `.glb` files and dress thumbnail images and stores them in the browser's **Cache Storage**. The catalog JSON and user favorites are persisted in **IndexedDB**.

When the user is offline:

- Previously loaded 3D avatar models render instantly from local cache.
- Favorited and recently browsed dresses are fully accessible.
- Mutations (e.g., deleting a saved dress) are applied optimistically and queued for **Background Sync** — replayed automatically on reconnection.

---

## API Documentation

Interactive Swagger UI is served by the Express server:

```
http://localhost:8000/api-docs
```

FastAPI's auto-generated OpenAPI docs:

```
http://localhost:8888/docs        # Swagger UI
http://localhost:8888/redoc       # ReDoc
```

---

## Testing

```bash
# API Gateway unit & integration tests (Jest)
cd server && npm test

# AI Server tests (pytest)
cd ai-server && pytest --cov
```

Test configuration:

- Server: Jest with `--experimental-vm-modules` for ESM, Supertest for HTTP assertions
- AI Server: pytest with pytest-cov for coverage reporting

---

## Contributing

1. Fork the repository and create a feature branch from `main`.
2. Follow the existing code style — ESLint + Prettier are enforced for TypeScript; Ruff for Python.
3. Write or update tests for any changed behaviour.
4. Open a pull request with a clear description of the change and its motivation.

---

**End of README**
