

# Project Context: AI-Powered 3D Virtual Try-On & Scene Generation Web App

## 1. System Overview

The project is a production-grade, distributed web application that allows users to generate a 3D avatar of themselves, discover clothing via AI-driven search and web scraping, and virtually "try on" those clothes in AI-generated background scenes.

Because the AI and 3D generation tasks are compute-heavy and long-running, the system uses an **Asynchronous Microservices Architecture** with an API Gateway pattern. It also includes Progressive Web App (PWA) capabilities for offline viewing of 3D models and saved dresses.

## 2. Tech Stack

* **Frontend:** Next.js (React, TypeScript), configured as a PWA with Service Workers and IndexedDB for offline support.
* **API Gateway & Primary Backend:** Express.js (Node.js). Handles routing, authentication, caching, and database CRUD. Next.js *only* communicates with this server.
* **AI & Scraping Engine:** FastAPI (Python). Handles GPU-intensive tasks (3D generation, VTON, Stable Diffusion), LLM context extraction, and web scraping.
* **Database:** PostgreSQL.
* **ORM:** Prisma. The `schema.prisma` file is housed in the Express app but generates both JavaScript and Python clients to ensure both backends share a strictly typed database schema.
* **Cache & Message Broker:** Redis. Serves a dual purpose: caching dress search results for Express, and acting as the message queue broker for FastAPI.
* **Task Queue:** Celery (Python worker nodes processing background AI jobs from Redis).
* **Cloud Storage:** AWS S3 (or equivalent) for storing raw user photos, scraped dress images, final `.glb`/`.gltf` 3D models, and generated scene images.
* **External APIs:** Serper API (for Google Search scraping), LLM API (OpenAI/Anthropic for context extraction).

## 3. Core Features & Data Flow

### Feature A: 3D Avatar Generation

1. User uploads front, side, and back photos via Next.js.
2. Express saves images to S3 and drops an `AVATAR_GENERATION` job ticket into Redis. It instantly returns a `jobId` to Next.js.
3. A FastAPI/Celery worker picks up the job, runs the 3D reconstruction model, saves the `.glb` file to S3, and updates the PostgreSQL database to `COMPLETED`.
4. Next.js polls Express until the job is done and renders the 3D model in the browser.

### Feature B: AI-Driven Dress Discovery

1. User searches for an event/style (e.g., "beach wedding dress").
2. Express forwards the prompt to FastAPI, which uses an LLM to extract JSON search parameters (style, colors, event).
3. Express checks Redis to see if this exact parameter set has been searched recently.
4. If cached, Express returns dresses instantly. If not, FastAPI uses the Serper API to scrape Google, extracts dress data and original store links, saves them to PostgreSQL, and returns them to Express to cache and send to the user.

### Feature C: Virtual Try-On (VTON) & Scene Generation

1. User selects their 3D Avatar, a Dress, and enters a scene prompt (e.g., "sunset by the ocean").
2. Express drops a `TRY_ON_SCENE` job into Redis and returns a `jobId`.
3. FastAPI/Celery downloads the 3D model and dress, runs the VTON and background generation models, saves the final composite image to S3, and updates the database.
4. Next.js polls, retrieves the final image, and displays it. The user can save the image or click the original store link to buy the dress.

## 4. Offline & PWA Capabilities

* **Service Workers:** Intercept network requests. Once the large `.glb` 3D avatar file or dress thumbnail images are downloaded, they are cached locally in the browser.
* **IndexedDB:** Stores the user's "Saved/Favorite" dresses and their history of generated scenes, allowing them to browse their virtual wardrobe on an airplane or subway without internet access.
* **Optimistic UI & Background Sync:** If an offline user deletes a saved dress, the UI updates instantly. The Service Worker queues the API request and silently fires it to the Express server the moment the device reconnects to the internet.

## 5. Database Schema Summary (PostgreSQL)

* `users`: Authentication and profile data.
* `avatars`: Links to the S3 images and final 3D `.glb` model.
* `dresses`: The global catalog of scraped dresses (ensuring no duplicate scraping).
* `user_saved_dresses`: Join table for user favorites (synced to IndexedDB).
* `ai_jobs`: The central control table. Tracks `job_type`, `status` (PENDING, PROCESSING, COMPLETED, FAILED), and `result_url`.
* `generated_scenes`: The user's gallery of completed VTON images.

Here is the context for my project. Based on this, help me write the code for...