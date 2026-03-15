"""
app/tasks/search.py
-------------------
Celery task for the DRESS_SEARCH pipeline.

Pipeline
~~~~~~~~
1. Update DressSearch status → PROCESSING
2. LLM extraction  → structured search params (via extract_search_params)
3. Serper Shopping → raw product list       (via search_dresses)
4. Upsert products → DressProduct rows in PostgreSQL (skip storeUrl duplicates)
5. Update DressSearch status → COMPLETED, parsedParams = {dress_ids: [...]}

Error handling
~~~~~~~~~~~~~~
Any unhandled exception marks the job FAILED (with error_message) and
re-raises so Celery can apply its retry / failure semantics.

Async strategy
~~~~~~~~~~~~~~
Prisma Python client uses asyncio.  Because Celery workers run as plain
synchronous processes we create one dedicated asyncio event loop per task
invocation (same pattern as dress_tasks.py).
"""

from __future__ import annotations

import asyncio
import logging
from typing import Any

from app.db.prisma_connect import db
from app.services.search_service import extract_search_params, search_dresses
from app.worker.celery_app import celery_app

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Async helpers
# ---------------------------------------------------------------------------


async def _ensure_db() -> None:
    """Connect the shared Prisma client if not already connected."""
    if not db.is_connected():
        await db.connect()


async def _set_status(
    job_id: str,
    status: str,
    *,
    error_message: str | None = None,
    parsed_params: dict | None = None,
) -> None:
    """Update DressSearch status (and optional fields) in Postgres."""
    await _ensure_db()
    data: dict[str, Any] = {"status": status}
    if error_message is not None:
        data["errorMessage"] = error_message
    if parsed_params is not None:
        data["parsedParams"] = parsed_params
    await db.dresssearch.update(  # type: ignore[union-attr]
        where={"id": job_id},
        data=data,  # type: ignore[arg-type]
    )


async def _upsert_dresses(job_id: str, dresses: list[dict]) -> list[str]:
    """
    Create DressProduct rows, skipping entries whose storeUrl is already
    stored for this search session.

    Returns
    -------
    list of DressProduct IDs that were created or already existed.
    """
    await _ensure_db()
    ids: list[str] = []
    for dress in dresses:
        store_url: str = dress.get("storeUrl", "")
        if not store_url:
            continue
        existing = await db.dressproduct.find_first(  # type: ignore[union-attr]
            where={"productUrl": store_url, "searchId": job_id}
        )
        if existing:
            ids.append(existing.id)
            continue
        created = await db.dressproduct.create(  # type: ignore[union-attr]
            data={
                "searchId": job_id,
                "productName": dress.get("title") or "",
                "price": dress.get("price") or None,
                "imageUrl": dress.get("imageUrl") or None,
                "productUrl": store_url,
                "brand": dress.get("brand") or None,
                "source": "serper",
            }
        )
        ids.append(created.id)
    return ids


async def _run_pipeline(job_id: str, payload: dict) -> list[str]:
    """
    Full async pipeline.  The synchronous Celery task wraps this in a
    dedicated event loop.

    Returns the list of DressProduct IDs created / found.
    """
    # Step 1 — mark PROCESSING
    await _set_status(job_id, "PROCESSING")
    logger.info("[%s] DRESS_SEARCH pipeline started", job_id)

    # Step 2 — LLM extraction (synchronous SDK — run in executor)
    loop = asyncio.get_event_loop()
    params: dict = await loop.run_in_executor(
        None, extract_search_params, payload["prompt"]
    )
    logger.info("[%s] Extracted params: %s", job_id, params)

    # Step 3 — Serper Shopping (synchronous httpx — run in executor)
    dresses: list[dict] = await loop.run_in_executor(
        None, search_dresses, params
    )
    logger.info("[%s] Serper returned %d item(s)", job_id, len(dresses))

    # Step 4 — Upsert into PostgreSQL
    dress_ids = await _upsert_dresses(job_id, dresses)
    logger.info("[%s] Upserted %d dress(es)", job_id, len(dress_ids))

    # Step 5 — COMPLETED
    await _set_status(
        job_id,
        "COMPLETED",
        parsed_params={"dress_ids": dress_ids},
    )
    logger.info("[%s] DRESS_SEARCH pipeline COMPLETED", job_id)
    return dress_ids


# ---------------------------------------------------------------------------
# Celery task — thin synchronous wrapper
# ---------------------------------------------------------------------------


@celery_app.task(
    bind=True,
    name="app.tasks.search.dress_search_task",
    max_retries=3,
    default_retry_delay=15,
    autoretry_for=(ConnectionError, TimeoutError),
    retry_backoff=True,
)
def dress_search_task(self, job_id: str, payload: dict) -> dict[str, Any]:
    """
    Celery entry point for DRESS_SEARCH jobs.

    Parameters
    ----------
    job_id:
        The ``DressSearch.id`` (UUID string) created by the Express API.
    payload:
        Must contain at minimum ``{"prompt": "<natural-language search>"}`.
    """
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    try:
        dress_ids = loop.run_until_complete(_run_pipeline(job_id, payload))
        return {"status": "COMPLETED", "job_id": job_id, "dress_ids": dress_ids}

    except Exception as exc:
        error_msg = str(exc)
        logger.exception("[%s] DRESS_SEARCH task FAILED: %s", job_id, error_msg)
        try:
            loop.run_until_complete(
                _set_status(job_id, "FAILED", error_message=error_msg)
            )
        except Exception as db_exc:
            logger.exception(
                "[%s] Could not write FAILED status: %s", job_id, db_exc
            )
        raise

    finally:
        try:
            if db.is_connected():
                loop.run_until_complete(db.disconnect())
        except Exception:
            pass
        loop.close()
