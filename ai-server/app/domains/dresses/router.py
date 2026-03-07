"""
router.py — Dress Search API
-----------------------------
Provides two endpoints:

POST /internal/ai/search-dresses
    Accepts a prompt + geo, creates a PENDING DressSearch in Postgres,
    dispatches the Celery pipeline task, and immediately returns a task_id.

WebSocket /internal/ai/ws/status/{task_id}
    The frontend connects here after receiving the task_id.  This handler
    subscribes to the Redis Pub/Sub channel for the given task_id and
    streams the result JSON as a single message once the worker publishes it.

    If the worker already finished before the client connects, we check the
    Celery result backend for a cached result and return it immediately.

SSE (alternative) GET /internal/ai/sse/status/{task_id}
    Same as WebSocket but using Server-Sent Events for clients that prefer
    a unidirectional HTTP stream.
"""

from __future__ import annotations

import asyncio
import json
import logging
from typing import AsyncIterator
from uuid import uuid4

import redis.asyncio as aioredis
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse

from app.api.deps import get_db
from app.core.config import settings
from app.schemas.dress_search import SearchDressesRequest, SearchDressesResponse
from app.worker.celery_app import celery_app
from app.worker.dress_tasks import process_dress_search

logger = logging.getLogger("api_security")

router = APIRouter(tags=["Dress Search"])

# Redis Pub/Sub channel prefix (must match dress_tasks.py)
_PUBSUB_CHANNEL_PREFIX = "search:"

# How long (seconds) the WebSocket / SSE handler waits for a result before
# sending a timeout message to the client.
_STREAM_TIMEOUT_S: float = 180.0


# ---------------------------------------------------------------------------
# POST /search-dresses
# ---------------------------------------------------------------------------

@router.post(
    "/search-dresses",
    response_model=SearchDressesResponse,
    status_code=202,
    summary="Initiate a dress search",
    description=(
        "Accepts a free-text dress preference prompt and a geographic context. "
        "Creates a PENDING search record in the database, enqueues the "
        "processing pipeline on Celery, and returns a task_id immediately. "
        "Connect to `/ws/status/{task_id}` to receive the results."
    ),
)
async def search_dresses(
    body: SearchDressesRequest,
    db=Depends(get_db),
) -> SearchDressesResponse:
    """
    Enqueue a dress search and return immediately.

    The actual work (LLM parsing, Serper, scraping) is done asynchronously
    in the Celery worker.  The frontend should connect to the WebSocket
    endpoint to receive the final product list.
    """
    # 1. Create the DressSearch record in Postgres with PENDING status.
    #    We generate the task_id ourselves so we can store it before the
    #    Celery task is dispatched (avoids a race condition on the unique
    #    taskId constraint if Celery replies faster than our DB write).
    task_id = str(uuid4())

    try:
        search = await db.dresssearch.create(
            data={
                "prompt": body.prompt,
                "geo": body.geo,
                "taskId": task_id,
                "status": "PENDING",
            }
        )
    except Exception as exc:
        logger.exception("Failed to create DressSearch record: %s", exc)
        raise HTTPException(
            status_code=500,
            detail="Could not initialise the search. Please try again.",
        )

    # 2. Dispatch the Celery task.
    #    We use apply_async with task_id so Celery's result backend key
    #    matches what is stored in Postgres and Redis.
    try:
        process_dress_search.apply_async(
            kwargs={
                "search_id": search.id,
                "task_id": task_id,
                "prompt": body.prompt,
                "geo": body.geo,
            },
            task_id=task_id,
        )
    except Exception as exc:
        # If dispatch fails, mark the search as FAILED so the client is not
        # left polling forever.
        logger.exception("Failed to dispatch Celery task %s: %s", task_id, exc)
        await db.dresssearch.update(
            where={"id": search.id},
            data={"status": "FAILED", "errorMessage": "Task dispatch failed."},
        )
        raise HTTPException(
            status_code=503,
            detail="The search queue is currently unavailable. Please try again shortly.",
        )

    logger.info(
        "DressSearch queued — search_id=%s  task_id=%s  geo=%r",
        search.id,
        task_id,
        body.geo,
    )

    return SearchDressesResponse(
        task_id=task_id,
        search_id=search.id,
        status="PENDING",
        message=(
            "Your dress search has been queued. "
            f"Connect to /internal/ai/ws/status/{task_id} to receive results in real time."
        ),
    )


# ---------------------------------------------------------------------------
# WebSocket /ws/status/{task_id}
# ---------------------------------------------------------------------------

@router.websocket("/ws/status/{task_id}")
async def websocket_search_status(
    websocket: WebSocket,
    task_id: str,
) -> None:
    """
    WebSocket endpoint that streams the pipeline result to the client.

    Protocol:
    1. Client connects.
    2. Server checks if the task has already completed (result in Celery
       backend).  If yes, sends the result and closes.
    3. Otherwise, server subscribes to the Redis Pub/Sub channel
       ``search:<task_id>`` and forwards the first message it receives.
    4. On timeout, sends a TIMEOUT message and closes.
    5. Any Redis / network error sends an ERROR message and closes.
    """
    await websocket.accept()

    # ── Fast path: result already in Celery backend ─────────────────────────
    try:
        async_result = celery_app.AsyncResult(task_id)
        if async_result.ready():
            result = async_result.result
            if isinstance(result, dict):
                await websocket.send_text(json.dumps(result))
            else:
                await websocket.send_text(
                    json.dumps({"task_id": task_id, "status": "COMPLETED", "products": []})
                )
            await websocket.close()
            return
    except Exception as exc:
        logger.debug("WebSocket: Celery backend check failed for %s — %s", task_id, exc)
        # Non-fatal: fall through to Pub/Sub path

    # ── Slow path: subscribe to Redis and wait ───────────────────────────────
    channel = f"{_PUBSUB_CHANNEL_PREFIX}{task_id}"
    redis_client = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
    pubsub = redis_client.pubsub()

    try:
        await pubsub.subscribe(channel)
        logger.info("WebSocket: subscribed to channel=%s", channel)

        # Send a "connected" acknowledgement so the frontend knows we are live
        await websocket.send_text(
            json.dumps({"task_id": task_id, "status": "PROCESSING"})
        )

        deadline = asyncio.get_event_loop().time() + _STREAM_TIMEOUT_S

        while asyncio.get_event_loop().time() < deadline:
            # Check for disconnect from client side
            try:
                # Non-blocking receive with a short timeout
                await asyncio.wait_for(websocket.receive_text(), timeout=0.1)
            except asyncio.TimeoutError:
                pass  # No message from client — that's fine
            except WebSocketDisconnect:
                logger.info("WebSocket: client disconnected from %s", channel)
                return

            # Poll Redis for a published result (non-blocking)
            message = await pubsub.get_message(timeout=1.0)
            if message and message["type"] == "message":
                data = message["data"]
                await websocket.send_text(data)
                logger.info("WebSocket: result forwarded on channel=%s", channel)
                await websocket.close()
                return

            # Yield control to the event loop briefly
            await asyncio.sleep(0.5)

        # Stream timeout reached
        await websocket.send_text(
            json.dumps({
                "task_id": task_id,
                "status": "TIMEOUT",
                "error": "No result received within the time limit. Check back via the status endpoint.",
            })
        )
        await websocket.close()

    except WebSocketDisconnect:
        logger.info("WebSocket: client disconnected from channel=%s", channel)
    except Exception as exc:
        logger.exception("WebSocket: error on channel=%s — %s", channel, exc)
        try:
            await websocket.send_text(
                json.dumps({"task_id": task_id, "status": "ERROR", "error": str(exc)})
            )
            await websocket.close()
        except Exception:
            pass
    finally:
        await pubsub.unsubscribe(channel)
        await redis_client.aclose()


# ---------------------------------------------------------------------------
# SSE /sse/status/{task_id}  (optional alternative to WebSocket)
# ---------------------------------------------------------------------------

@router.get(
    "/sse/status/{task_id}",
    summary="SSE stream for search status",
    description=(
        "Server-Sent Events alternative to the WebSocket endpoint. "
        "The client receives a single `data:` event when the pipeline completes."
    ),
)
async def sse_search_status(task_id: str) -> StreamingResponse:
    """
    Server-Sent Events endpoint — useful for clients that cannot use
    WebSockets (e.g. some mobile frameworks, simple browser EventSource).
    """

    async def event_generator() -> AsyncIterator[str]:
        # Fast path: already complete
        try:
            async_result = celery_app.AsyncResult(task_id)
            if async_result.ready():
                data = json.dumps(async_result.result or {})
                yield f"data: {data}\n\n"
                return
        except Exception:
            pass

        channel = f"{_PUBSUB_CHANNEL_PREFIX}{task_id}"
        redis_client = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
        pubsub = redis_client.pubsub()

        try:
            await pubsub.subscribe(channel)
            # Heartbeat comment to keep the connection alive
            yield ": connected\n\n"

            deadline = asyncio.get_event_loop().time() + _STREAM_TIMEOUT_S

            while asyncio.get_event_loop().time() < deadline:
                message = await pubsub.get_message(timeout=1.0)
                if message and message["type"] == "message":
                    yield f"data: {message['data']}\n\n"
                    return

                # Heartbeat every ~5 polls to prevent proxy timeouts
                yield ": heartbeat\n\n"
                await asyncio.sleep(0.5)

            timeout_payload = json.dumps({
                "task_id": task_id,
                "status": "TIMEOUT",
                "error": "Result not ready within the time limit.",
            })
            yield f"data: {timeout_payload}\n\n"

        finally:
            await pubsub.unsubscribe(channel)
            await redis_client.aclose()

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",  # disable Nginx buffering
        },
    )
