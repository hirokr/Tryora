### The Dual Role of Redis

Before diving into the routes, we must define exactly where Redis sits, because it serves two entirely different purposes in your stack:

1. **As a Cache (Attached to Express.js):** When a user searches for "summer beach dress," Express checks Redis. If the JSON data from a previous identical search is there, Express returns it instantly. If not, it asks FastAPI to scrape it, and then Express saves the result in Redis with a "Time to Live" (TTL) of maybe 24 hours.
2. **As a Message Broker (Attached to FastAPI/Celery):** When a user requests a 3D avatar or Try-On, Express pushes a "Job Ticket" into a Redis Queue. FastAPI (using Celery workers) constantly pulls tickets from this queue, processes the heavy AI tasks, and updates the database when finished.

---

## Part 1: Express.js APIs (The Gateway)

Your Next.js frontend will exclusively call these endpoints. Express handles authentication, database CRUD, and caching.

### 1. User Management (CRUD)

Standard RESTful routes to manage user accounts and authentication (likely using JWTs).

| Method | Endpoint | Description | Payload (Request) | Response (Success) |
| --- | --- | --- | --- | --- |
| **POST** | `/api/users/register` | Creates a new user. | `{ email, password, name }` | `{ token, user: { id, name } }` |
| **POST** | `/api/users/login` | Authenticates user & returns JWT. | `{ email, password }` | `{ token, user: { id, name } }` |
| **GET** | `/api/users/me` | Fetches current user profile. | *Headers: Bearer Token* | `{ id, email, name, avatarUrl }` |
| **PUT** | `/api/users/me` | Updates user details. | `{ name, preferences }` | `{ success: true, user }` |
| **DELETE** | `/api/users/me` | Deletes the user account. | *Headers: Bearer Token* | `{ success: true }` |

### 2. Avatar 3D Generation

These routes handle the initial 3-photo upload and 3D model generation.

| Method | Endpoint | Description | Payload | Response |
| --- | --- | --- | --- | --- |
| **POST** | `/api/avatar/generate` | Uploads front, side, back photos to S3 and triggers FastAPI job. | `FormData: { front, side, back }` | `202 Accepted: { jobId: "job_123" }` |
| **GET** | `/api/avatar/status/:jobId` | Next.js polls this to check if FastAPI is done generating the 3D model. | *None* | `{ status: "processing" }` OR `{ status: "completed", modelUrl: "s3://.../model.glb" }` |
| **GET** | `/api/avatar/me` | Fetches the user's completed 3D model for offline/PWA caching. | *None* | `{ modelUrl: "s3://.../model.glb" }` |

### 3. Dress Discovery (Search & Scraping)

Express intercepts these requests to check the Redis Cache before bothering FastAPI.

| Method | Endpoint | Description | Payload | Response |
| --- | --- | --- | --- | --- |
| **POST** | `/api/discovery/search` | User searches for a dress/event. Express checks Redis; if miss, calls FastAPI. | `{ prompt: "beach wedding in july" }` | `[ { dressId, name, imageUrl, storeLink, price } ]` |
| **POST** | `/api/discovery/save` | User saves a dress to their favorites (for offline viewing). | `{ dressId }` | `{ success: true }` |
| **GET** | `/api/discovery/saved` | Fetches saved dresses for the PWA offline IndexedDB sync. | *None* | `[ { dress data... } ]` |

### 4. Virtual Try-On (VTON) & Scene Generation

Because VTON and Stable Diffusion take a long time, these are strictly asynchronous polling endpoints.

| Method | Endpoint | Description | Payload | Response |
| --- | --- | --- | --- | --- |
| **POST** | `/api/try-on/generate` | Requests a try-on with a specific dress and scene context. | `{ dressId, scenePrompt: "standing by the ocean" }` | `202 Accepted: { jobId: "job_456" }` |
| **GET** | `/api/try-on/status/:jobId` | Next.js polls this for the final image. | *None* | `{ status: "completed", resultUrl: "s3://.../result.jpg" }` |
| **GET** | `/api/try-on/history` | Gets all past generated images for the user's gallery (and offline cache). | *None* | `[ { id, resultUrl, originalDressLink } ]` |
| **DELETE** | `/api/try-on/:id` | Deletes a saved try-on image. | *None* | `{ success: true }` |

---

## Part 2: FastAPI & Celery (The Internal AI Engine)

Next.js **never** sees these endpoints. Only your Express.js server calls these. These are entirely internal APIs designed to accept heavy workloads and manage the LLM/GPU tasks.

### 1. Internal AI Webhooks & Task Endpoints

Rather than standard REST routes, FastAPI primarily exposes endpoints to queue tasks and endpoints for the LLM to return data synchronously.

| Method | Internal Endpoint | Description | Payload from Express | Action / Response |
| --- | --- | --- | --- | --- |
| **POST** | `/internal/ai/avatar` | Express sends the S3 URLs of the 3 uploaded photos. | `{ userId, images: [url1, url2, url3] }` | FastAPI drops a ticket in Redis/Celery. Returns `202 Accepted { jobId }`. |
| **POST** | `/internal/ai/scrape` | Express asks for scraped dresses based on a prompt. (Synchronous task). | `{ prompt: "beach wedding" }` | FastAPI runs LLM, uses Serper API, scrapes data, and returns JSON array of dresses instantly to Express. |
| **POST** | `/internal/ai/try-on` | Express requests a VTON + Scene generation. | `{ userId, avatarUrl, dressImageUrl, scenePrompt }` | FastAPI drops ticket in Redis/Celery. Returns `202 Accepted { jobId }`. |

### How the Async Loop Closes

Notice that FastAPI's Try-On and Avatar routes only return a `jobId`. How does Express know when it's done? You have two choices:

1. **Database Polling (Simpler):** When Celery finishes the GPU task, it saves the final `model.glb` or `.jpg` to S3, and updates the MongoDB/Postgres database row for `jobId` to "completed". Express just checks the database when Next.js polls it.
2. **Webhooks (More Advanced):** When Celery finishes, FastAPI fires an HTTP POST request *back* to Express (e.g., `POST express-server.com/api/webhooks/ai-complete`) to say, "I'm done, here is the data."

