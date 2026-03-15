# Tryora FastAPI Server

This service is the AI and scraping execution engine for Tryora, handling GPU-heavy workflows like avatar generation, virtual try-on scene synthesis, and dress search enrichment. It is designed to run asynchronous compute pipelines and persist job results for retrieval by the main backend.

## Architecture Position

This repository is not the user-facing API. The Express.js gateway enqueues jobs and polls status, while this FastAPI + Celery service processes AI tasks, stores output artifacts in Cloudflare R2, and updates `ai_jobs` in PostgreSQL.

## Local Setup

1. Clone the repository and enter the project folder.
2. Copy environment template:

```bash
cp .env.example .env
```

3. Fill all required values in `.env`.
4. Start the local stack:

```bash
docker compose up --build
```

## Run Tests

```bash
pytest tests/ -v
```

## Job Types

All jobs are submitted to `POST /jobs` with a top-level `jobType` and `payload`.

### 1. `AVATAR_GENERATION`

```json
{
	"jobType": "AVATAR_GENERATION",
	"payload": {
		"user_id": "user-123",
		"front_photo_url": "https://example.com/front.jpg",
		"side_photo_url": "https://example.com/side.jpg",
		"back_photo_url": "https://example.com/back.jpg"
	}
}
```

### 2. `TRY_ON_SCENE`

```json
{
	"jobType": "TRY_ON_SCENE",
	"payload": {
		"user_id": "user-123",
		"avatar_glb_url": "https://cdn.example.com/avatar.glb",
		"dress_image_url": "https://example.com/dress.jpg",
		"scene_prompt": "sunset rooftop fashion shoot"
	}
}
```

### 3. `DRESS_SEARCH`

```json
{
	"jobType": "DRESS_SEARCH",
	"payload": {
		"query": "red silk evening gown",
		"max_results": 5
	}
}
```

## Deployment

Use Railway for the FastAPI/Celery runtime and Hugging Face Spaces (ZeroGPU) for remote OOTDiffusion inference. See `DEPLOYMENT.md` for full deployment steps, required environment variables, and production checklist.

## License

Code in this repository is MIT-licensed unless otherwise noted. OOTDiffusion is a third-party dependency licensed under Apache 2.0.
