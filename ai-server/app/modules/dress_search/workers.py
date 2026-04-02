"""
dress_tasks.py
--------------
Celery task implementing the full dress-search pipeline.

Pipeline overview
~~~~~~~~~~~~~~~~~
1. Update DB status → PROCESSING
2. LLM parsing      → DressSearchParams
3. Embed params     → vector
4. ChromaDB query   → cache hit?
   └─ YES → link cached products, status = COMPLETED, broadcast, return
5. Serper Shopping  → raw product list (smart query)
6. For each product:
   a. If description is missing → ScraperAPI → JSON-LD extraction
   b. LLM formatter → DressProductSchema
7. Save products to Postgres
8. Upsert embeddings + metadata into ChromaDB
9. Status = COMPLETED, broadcast via Redis Pub/Sub

Error handling
~~~~~~~~~~~~~~
- Any exception not caught at the step level is caught at the task level.
- DB status is set to FAILED with an error message.
- The failure is broadcast so the frontend can show a user-friendly message.
- Celery auto-retry is enabled (max 3) for transient errors (network, DB).

Event loop strategy
~~~~~~~~~~~~~~~~~~~
Because Celery workers run in plain synchronous Python processes, we create
one asyncio event loop for the entire task execution and close it cleanly at
the end.  All async helpers are defined as coroutines and gathered into a
single top-level coroutine (_run_pipeline) to avoid repeated
loop creation/teardown overhead.
"""

from __future__ import annotations

import asyncio
import json
import logging
from typing import Any, Optional

import redis

from app.config.settings import settings
from app.db.prisma_connect import db
from app.db.vectordb import VectorStore
from app.infrastructure.external.openrouter_client import open_api
from app.modules.dress_search.formatter import llm_formatter
from app.modules.dress_search.parser import llm_parser
from app.schemas.dress_search import DressProductSchema, DressSearchParams
from app.modules.dress_search.query_builder import build_shopping_query
from app.modules.dress_search.scraper_api import scraper_api
from app.modules.dress_search.serper_shopping import serper_shopping
from app.infrastructure.queue.celery_app import celery_app

logger = logging.getLogger("api_security")

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

_CHROMA_COLLECTION = "dress_searches"
_CACHE_DISTANCE_THRESHOLD = 0.15
_SERPER_NUM_RESULTS = 10
_MAX_SCRAPER_FALLBACKS = 5
_PUBSUB_CHANNEL_PREFIX = "search:"


# ---------------------------------------------------------------------------
# Redis broadcast helper (synchronous)
# ---------------------------------------------------------------------------

def _broadcast(task_id: str, payload: dict[str, Any]) -> None:
    """Publish the pipeline result to Redis Pub/Sub so WebSocket handlers forward it."""
    r = redis.from_url(settings.REDIS_URL, decode_responses=True)
    channel = f"{_PUBSUB_CHANNEL_PREFIX}{task_id}"
    try:
        r.publish(channel, json.dumps(payload))
        logger.info("Broadcast status=%s to channel=%s", payload.get("status"), channel)
    except Exception as exc:
        logger.exception("Redis broadcast failed for channel=%s: %s", channel, exc)
    finally:
        r.close()


# ---------------------------------------------------------------------------
# Async DB / cache helpers
# ---------------------------------------------------------------------------

async def _ensure_db() -> None:
    """Connect the shared Prisma client if not already connected."""
    if not db.is_connected():
        await db.connect()


async def _set_status(
    search_id: str,
    status: str,
    error: Optional[str] = None,
    parsed_params: Optional[dict] = None,
) -> None:
    """Update DressSearch status (and optional fields) in Postgres."""
    await _ensure_db()
    update_data: dict[str, Any] = {"status": status}
    if error is not None:
        update_data["errorMessage"] = error
    if parsed_params is not None:
        update_data["parsedParams"] = parsed_params
    await db.dresssearch.update(  # type: ignore[union-attr]
        where={"id": search_id},
        data=update_data,  # type: ignore[arg-type]
    )


async def _save_products(search_id: str, products: list[DressProductSchema]) -> None:
    """Bulk-create DressProduct rows in Postgres."""
    await _ensure_db()
    for p in products:
        await db.dressproduct.create(  # type: ignore[union-attr]
            data={
                "searchId": search_id,
                "productName": p.product_name,
                "price": p.price,
                "imageUrl": p.image_url,
                "productUrl": p.product_url,
                "description": p.description,
                "brand": p.brand,
                "availability": p.availability,
                "rawMetadata": p.raw_metadata or {},
                "source": p.source,
            }
        )


async def _link_cached_products(
    search_id: str, chroma_hits: list[dict[str, Any]]
) -> list[DressProductSchema]:
    """Re-materialise DressProductSchema from ChromaDB metadata and persist."""
    await _ensure_db()
    products: list[DressProductSchema] = []
    for hit in chroma_hits:
        meta: dict = hit.get("metadata", {})
        url = meta.get("product_url")
        if not url:
            continue
        products.append(
            DressProductSchema(
                product_name=meta.get("product_name", ""),
                price=meta.get("price") or None,
                image_url=meta.get("image_url") or None,
                product_url=url,
                description=meta.get("description") or None,
                brand=meta.get("brand") or None,
                availability=meta.get("availability") or None,
                source="cache",
            )
        )
    if products:
        await _save_products(search_id, products)
    return products


async def _embed_params(params: DressSearchParams) -> list[float]:
    """Embed the serialised DressSearchParams JSON using OpenRouter embeddings."""
    return await open_api.get_embeddings(params.model_dump_json(exclude_none=True))


async def _query_chroma_cache(
    vector_store: VectorStore, embedding: list[float]
) -> list[dict[str, Any]]:
    """Return ChromaDB hits below the distance threshold; empty list on error."""
    try:
        raw: dict = vector_store.search(query_embedding=embedding, n_results=10)
    except Exception as exc:
        logger.warning("ChromaDB cache query failed — skipping cache: %s", exc)
        return []

    ids: list = (raw.get("ids") or [[]])[0]
    distances: list = (raw.get("distances") or [[]])[0]
    metadatas: list = (raw.get("metadatas") or [[]])[0]

    hits = [
        {"id": did, "distance": dist, "metadata": meta or {}}
        for did, dist, meta in zip(ids, distances, metadatas)
        if dist <= _CACHE_DISTANCE_THRESHOLD
    ]
    logger.info("ChromaDB: %d cache hit(s) (threshold=%.2f)", len(hits), _CACHE_DISTANCE_THRESHOLD)
    return hits


async def _upsert_to_chroma(
    vector_store: VectorStore,
    search_id: str,
    params: DressSearchParams,
    embedding: list[float],
    products: list[DressProductSchema],
) -> None:
    """Cache product metadata in ChromaDB for future cache hits."""
    for i, product in enumerate(products):
        doc_id = f"{search_id}__p{i}"
        metadata: dict[str, Any] = {
            "search_id": search_id,
            "product_name": product.product_name or "",
            "price": product.price or "",
            "image_url": product.image_url or "",
            "product_url": product.product_url,
            "description": (product.description or "")[:500],
            "brand": product.brand or "",
            "availability": product.availability or "",
            "source": product.source or "",
            "event": params.event or "",
            "season": params.season or "",
            "colors": json.dumps(params.colors or []),
        }
        try:
            vector_store.add_document(
                doc_id=doc_id, embedding=embedding,
                document=product.product_name, metadata=metadata,
            )
        except Exception as exc:
            logger.warning("ChromaDB upsert failed for doc_id=%s: %s", doc_id, exc)


# ---------------------------------------------------------------------------
# Async pipeline — runs inside a dedicated event loop per Celery task
# ---------------------------------------------------------------------------

async def _run_pipeline(
    search_id: str,
    task_id: str,
    prompt: str,
    geo: str,
    vector_store: VectorStore,
) -> dict[str, Any]:
    """
    Full async pipeline.  The synchronous Celery task wraps this in a
    dedicated event loop.
    """
    result: dict[str, Any] = {
        "task_id": task_id, "search_id": search_id,
        "status": "FAILED", "products": [], "error": None,
    }

    # Step 1 — mark PROCESSING
    await _set_status(search_id, "PROCESSING")
    logger.info("[%s] Pipeline started — search_id=%s", task_id, search_id)

    # Step 2 — LLM parsing (blocking network call → run in executor)
    logger.info("[%s] Step 2: LLM parsing", task_id)
    loop = asyncio.get_event_loop()
    params: DressSearchParams = await loop.run_in_executor(
        None, llm_parser.parse_prompt, prompt, geo
    )
    logger.info("[%s] Params: %s", task_id, params.model_dump_json(exclude_none=True))
    await _set_status(search_id, "PROCESSING", parsed_params=params.model_dump(exclude_none=True))

    # Step 3 — embed → ChromaDB cache check
    logger.info("[%s] Step 3: Cache check", task_id)
    embedding: list[float] = await _embed_params(params)
    cache_hits = await _query_chroma_cache(vector_store, embedding)

    if cache_hits:
        # ── CACHE HIT ──────────────────────────────────────────────────────
        logger.info("[%s] Cache HIT — %d result(s)", task_id, len(cache_hits))
        products = await _link_cached_products(search_id, cache_hits)
        await _set_status(search_id, "COMPLETED")
        result.update({"status": "COMPLETED", "products": [p.model_dump() for p in products]})
        return result

    # ── CACHE MISS ─────────────────────────────────────────────────────────
    logger.info("[%s] Cache MISS — querying Serper", task_id)

    # Step 4 — Serper Shopping
    logger.info("[%s] Step 4: Serper Shopping", task_id)
    search_query = build_shopping_query(params)
    logger.info("[%s] Query: %r", task_id, search_query)
    raw_items: list[dict] = await serper_shopping.search(search_query, num_results=_SERPER_NUM_RESULTS)
    logger.info("[%s] Serper: %d item(s)", task_id, len(raw_items))

    # Step 5 — ScraperAPI fallback for items without descriptions
    scrape_count = 0
    enriched: list[dict] = []

    for item in raw_items:
        url: str = item.get("productUrl", "")
        if item.get("description") or scrape_count >= _MAX_SCRAPER_FALLBACKS or not url:
            enriched.append(item)
            continue

        logger.info("[%s] Step 5: ScraperAPI for %s", task_id, url[:80])
        json_ld = await scraper_api.extract_json_ld(url)
        if json_ld:
            item["description"] = json_ld.get("description") or item.get("description")
            raw_brand = json_ld.get("brand")
            item["brand"] = (
                raw_brand.get("name") if isinstance(raw_brand, dict)
                else raw_brand or item.get("brand")
            )
            item["_json_ld"] = json_ld
            scrape_count += 1
        enriched.append(item)

    # Step 6 — LLM formatting
    logger.info("[%s] Step 6: Formatting %d item(s)", task_id, len(enriched))
    formatted: list[DressProductSchema] = []

    for item in enriched:
        try:
            if item.get("_json_ld"):
                product = await loop.run_in_executor(
                    None, llm_formatter.format_product, item["_json_ld"], "scraper"
                )
                if product:
                    product.image_url = product.image_url or item.get("imageUrl")
                    product.price = product.price or item.get("price")
                    product.product_url = product.product_url or item.get("productUrl", "")
                    product.raw_metadata = item
            else:
                product = await loop.run_in_executor(
                    None, llm_formatter.format_product, item, "serper"
                )
            if product and product.product_url:
                formatted.append(product)
        except Exception as exc:
            logger.warning("[%s] Skipping product — formatting error: %s", task_id, exc)

    logger.info("[%s] %d valid product(s) formatted", task_id, len(formatted))

    # Step 7 — Persist to Postgres + ChromaDB
    logger.info("[%s] Step 7: Persisting", task_id)
    if formatted:
        await _save_products(search_id, formatted)
        await _upsert_to_chroma(vector_store, search_id, params, embedding, formatted)

    # Step 8 — COMPLETED
    await _set_status(search_id, "COMPLETED")
    result.update({"status": "COMPLETED", "products": [p.model_dump() for p in formatted]})
    logger.info("[%s] Pipeline COMPLETED — %d product(s)", task_id, len(formatted))
    return result


# ---------------------------------------------------------------------------
# Celery task — thin sync wrapper
# ---------------------------------------------------------------------------

@celery_app.task(
    bind=True,
    name="app.worker.dress_tasks.process_dress_search",
    max_retries=3,
    default_retry_delay=15,
    autoretry_for=(ConnectionError, TimeoutError),
    retry_backoff=True,
)
def process_dress_search(
    self,
    search_id: str,
    task_id: str,
    prompt: str,
    geo: str,
) -> dict[str, Any]:
    """
    Celery entry point.  Creates a fresh asyncio event loop, executes the
    async pipeline, broadcasts the result, then tears down cleanly.
    """
    vector_store = VectorStore(
        host=settings.CHROMADB_HOST,
        port=settings.CHROMADB_PORT,
        collection_name=_CHROMA_COLLECTION,
    )
    result_payload: dict[str, Any] = {
        "task_id": task_id, "search_id": search_id,
        "status": "FAILED", "products": [], "error": None,
    }

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    try:
        result_payload = loop.run_until_complete(
            _run_pipeline(search_id, task_id, prompt, geo, vector_store)
        )
    except Exception as exc:
        error_msg = str(exc)
        logger.exception("[%s] Task FAILED: %s", task_id, error_msg)
        result_payload["error"] = error_msg
        try:
            loop.run_until_complete(_set_status(search_id, "FAILED", error=error_msg))
        except Exception as db_exc:
            logger.exception("[%s] Could not write FAILED status: %s", task_id, db_exc)
        raise  # allow Celery retry if the error type qualifies

    finally:
        # Always broadcast so the WebSocket handler is never left hanging
        _broadcast(task_id, result_payload)
        # Disconnect Prisma client gracefully
        try:
            if db.is_connected():
                loop.run_until_complete(db.disconnect())
        except Exception:
            pass
        loop.close()

    return result_payload
