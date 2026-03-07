# System Design: Tryora — Virtual Try-On Platform

This document merges the full system design covering architecture, asynchronous AI processing, and offline PWA support.

---

## 1. The Requirements (What are we building?)

- **Core Feature 1 (Onboarding):** User uploads 3 images. System generates and stores a 3D avatar.
- **Core Feature 2 (Discovery):** User inputs an event/search. The system uses an LLM to generate search parameters, checks cache/DB, and scrapes the web if necessary to return dress options.
- **Core Feature 3 (Try-On & Scene Gen):** User selects a dress. The system maps the dress to the 3D avatar and generates an AI background based on the event.
- **Core Feature 4 (Offline Support):** Previously generated 3D models and dress catalogs are accessible without an internet connection via PWA capabilities.
- **Traffic/System Assumption:** This is a **compute-heavy** system. CPU and GPU bottlenecks on the FastAPI server will be your biggest challenge, not database read/writes.

---

## 2. The Core Logic (Separation of Concerns)

- **Next.js:** Handles the UI, image uploads, displaying the final 3D viewer/images, and acts as a PWA with offline capabilities via a Service Worker.
- **Express.js (API Gateway & Orchestrator):** Manages user sessions, checks the Redis cache for dresses, and acts as the middleman so Next.js doesn't have to talk to multiple services.
- **FastAPI (The AI & Scraping Engine):** This is where the magic happens. It handles the heavy Python libraries for 3D generation (like smpl-x or PIFuHD), LLM prompting, the Serper API scraping,- and the Virtual Try-On (VTON) / Stable Diffusion background generation.
- **Celery (Task Worker):** A separate Python worker process that consumes jobs from the Redis queue and executes heavy GPU-bound AI tasks independently of the HTTP request lifecycle.

---

## 3. The High-Level Architecture

Because the AI tasks take time, a **Message Queue** is mandatory to prevent server crashes and browser timeouts.

| Layer           | Technology                                                    |
| --------------- | ------------------------------------------------------------- |
| Client          | Next.js (Browser + PWA Service Worker)                        |
| API Gateway     | Express.js                                                    |
| Cache           | Redis (recent dress searches)                                 |
| Message Queue   | Redis / RabbitMQ (pending AI jobs)                            |
| AI Worker       | FastAPI + Celery (GPU-enabled instances)                      |
| Database        | PostgreSQL (user data, job status, dress catalog)             |
| Object Storage  | AWS S3 / GCS (photos, `.glb`/`.gltf` files, generated scenes) |
| Browser Storage | Cache API (3D model files) + IndexedDB (dress catalog JSON)   |

---

## 4. The Data Flow (Step-by-Step)

### Phase A: The Discovery / Search Flow

1. **Request:** Next.js sends `"I need a dress for a summer beach wedding"` to Express.
2. **LLM Processing:** Express forwards this to FastAPI. FastAPI uses an LLM to extract structured context:
   ```json
   {
   	"style": "floral, light, maxi",
   	"event": "beach wedding",
   	"colors": ["yellow", "light blue", "pink"]
   }
   ```
3. **Cache Check:** FastAPI returns the context to Express. Express checks Redis: _Do we have a cached search for "floral maxi beach wedding"?_
   - **Cache Hit:** Return cached dresses to Next.js immediately.
   - **Cache Miss:** Express tells FastAPI to query the Database.
4. **Scraping (Fallback):** If the Database is empty, FastAPI hits the Serper API, scrapes Google, parses the dress data, saves images to S3, saves data/links to the Database, and returns the list to Express. Express caches the result in Redis and forwards it to Next.js.

### Phase B: The Try-On & Scene Generation Flow (Asynchronous)

This is the most critical flow. Holding an HTTP connection open for 10–60 seconds will cause browser timeouts. The solution is a job queue.

1. **Request:** User clicks a dress. Next.js tells Express: _"Put Dress ID #123 on User ID #456 in a beach setting."_
2. **Queue the Job:** Express does **not** wait for this to finish. It calls FastAPI, which immediately creates a Job Ticket with a unique ID (e.g., `job_987`) and drops it into the Redis queue.
3. **Immediate Response:** FastAPI responds to Express: _"Request received. Ticket: `job_987`."_ Express passes `job_987` back to Next.js with a `202 Accepted` status.
4. **Frontend Loading State:** Next.js shows a loading animation (e.g., _"Designing your look..."_) and begins polling Express every 3 seconds: _"Is `job_987` done?"_ (Alternatively, WebSockets can be used for real-time push updates.)
5. **Heavy Processing:** A Celery worker is constantly watching Redis. It picks up `job_987` and starts the GPU-heavy work: fetch the 3D model and dress image from S3, run the VTON model, run the image generator for the background.
6. **Completion:** Celery saves the final image to S3 and updates the Database to mark `job_987` as `"Complete"` with the resulting S3 image URL.
7. **Delivery:** The next time Next.js polls Express for `job_987`, Express reads the Database, sees it is complete, and returns the final image URL and the original store link.

> **Why this is production-grade:** If 1,000 users click "Generate" at the exact same time, the server will not crash. Redis holds 1,000 tickets in a queue, and Celery workers process them sequentially without overloading the GPU.

---

## 5. Making It Work Offline (PWA Architecture)

To allow users to access previously generated 3D models and browsed dresses without internet, Next.js is configured as a **Progressive Web App (PWA)** using a Service Worker and browser-native storage.

### 5.1 Caching the 3D Model (Service Worker + Cache API)

3D files (`.glb` / `.gltf`) used in viewers like Three.js / React Three Fiber can be 5 MB–20 MB.

- **How it works:** When the user first views their 3D avatar, Next.js downloads the `.glb` file. The Service Worker intercepts that download and saves a copy into the browser's **Cache Storage**.
- **The Offline Magic:** On subsequent visits without internet, the Service Worker intercepts the request for the 3D model, detects the offline state, and serves the `.glb` file instantly from local cache.

### 5.2 Saving the Dress Catalog (IndexedDB)

Local Storage only holds ~5 MB — not enough for a dress catalog. **IndexedDB** is a robust database built into the browser with no practical size limit for this use case.

- **How it works:** When a user browses or favorites dresses, Next.js writes the JSON data (dress name, price, original store link) into IndexedDB.
- **Image Caching:** The Service Worker also caches thumbnail images of previously viewed dresses so they render offline.

### 5.3 Handling Offline Actions (Optimistic UI + Background Sync)

Example scenario: user is offline and clicks "Delete" on a saved dress.

1. **Optimistic UI:** The app immediately removes the dress from the UI and IndexedDB, so the interaction feels instant and the user believes it worked.
2. **Background Sync:** The Service Worker queues the `DELETE` action. The moment the device reconnects to the internet, the Service Worker silently replays that request to the Express server to sync the real database.

---

## 6. Handling Edge Cases

| Risk                                    | Mitigation                                                                                                                                               |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Serper API gets blocked or rate-limited | Always keep a fallback catalog of generic dresses in the database so the user sees _something_ even if live scraping fails.                              |
| LLM hallucinations / malformed output   | Enforce strict JSON output validation using a library like **Instructor** or **LangChain** structured outputs to force the LLM to return a valid schema. |
| Cost overruns (LLM, Serper, GPU)        | Implement per-user rate limiting in Express. Prevent a single user from triggering "Generate Scene" more than N times per minute.                        |
| Long queue wait times                   | Expose estimated queue position in the polling response so Next.js can show the user meaningful progress (e.g., _"Position 4 in queue…"_).               |
| Service Worker serving stale 3D data    | Version the cached assets and invalidate old Service Worker caches on app update using a cache-busting strategy.                                         |
