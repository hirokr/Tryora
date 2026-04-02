# app/infrastructure/external

## Responsibility

Provides async HTTP client wrappers for all third-party APIs the application integrates with: LLM providers (OpenRouter, xAI), product data services (Serper Shopping, ScraperAPI), and 3D model generation (Tripo AI). Each client handles its own error handling, retries, and offline mode support.

## Files

| File | Description |
|---|---|
| `__init__.py` | Package marker. |
| `openrouter_client.py` | `OpenAPI` class — OpenAI-compatible client for OpenRouter embeddings API (used for ChromaDB cache embeddings). |
| `scraper_api_client.py` | `ScraperAPIService` — fetches product pages via ScraperAPI and extracts Schema.org/Product JSON-LD structured data (fallback enrichment when Serper lacks descriptions). |
| `serper_client.py` | `SerperShoppingService` — async client for Serper Google Shopping API, returns normalized product dicts. |
| `tripo_client.py` | `TripoClient` — async Tripo AI API client for image-to-3D model generation, with task polling, GLB download, exponential backoff on 429s, and offline mode support. |
| `xai_client.py` | Placeholder for xAI client integration. |

## Subdirectories

None.
