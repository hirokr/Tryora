# app/modules/dress_search

## Responsibility

Implements the full dress search pipeline: parses natural language dress preferences into structured parameters via xAI (Grok), queries Google Shopping through Serper, enriches product data with ScraperAPI JSON-LD extraction, formats results with an LLM, and caches embeddings in ChromaDB for future semantic cache hits. Results are streamed to clients via WebSocket or SSE.

## Files

| File                 | Description                                                                                                                                                                                                                         |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `__init__.py`        | Package marker.                                                                                                                                                                                                                     |
| `api.py`             | FastAPI router — `POST /search-dresses` to enqueue a search, `WebSocket /ws/status/{task_id}` and `SSE /sse/status/{task_id}` to stream results.                                                                                    |
| `formatter.py`       | `LLMFormatterService` — uses xAI (grok-3-mini) to normalize raw product data into `DressProductSchema`; fast-path for Serper data avoids LLM calls.                                                                                 |
| `parser.py`          | `LLMParserService` — uses xAI to parse free-text prompts into structured `DressSearchParams` (event, colors, fabric, budget, etc.).                                                                                                 |
| `query_builder.py`   | `build_shopping_query()` — pure function that constructs a Google Shopping search string from `DressSearchParams`.                                                                                                                  |
| `schemas.py`         | Pydantic models: `DressSearchParams`, `BudgetRange`, `SearchDressesRequest`, `SearchDressesResponse`, `SearchStatusResponse`, `DressProductSchema`.                                                                                 |
| `serper_shopping.py` | Compatibility wrapper re-exporting `SerperShoppingService` from `app.infrastructure.external.serper_client`.                                                                                                                        |
| `service.py`         | Placeholder for dress-search service (normalized backend layout).                                                                                                                                                                   |
| `workers.py`         | Celery task `process_dress_search` — full async pipeline: LLM parsing → embedding → ChromaDB cache check → Serper search → ScraperAPI fallback → LLM formatting → Postgres persistence → ChromaDB upsert → Redis Pub/Sub broadcast. |

## Subdirectories

None.
