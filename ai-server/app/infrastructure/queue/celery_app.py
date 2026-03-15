"""
celery_app.py
-------------
Single Celery application instance shared by the FastAPI process (for task
dispatch) and the worker processes (for task execution).

We use Redis as both the broker and the result backend so no additional
infrastructure is required beyond the Redis instance already needed for
WebSocket broadcasting.

Import this module everywhere you need to dispatch or query tasks:
::
    from app.worker.celery_app import celery_app
"""

from celery import Celery

from app.core.config import settings

celery_app = Celery(
    "tryora_ai",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    # Explicitly list task modules so auto-discovery is not needed
    include=[
        "app.worker.dress_tasks",
        "app.workers.try_on_task",
        "app.workers.prebake_task",
    ],
)

celery_app.conf.update(
    # ---- Serialisation ----
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",

    # ---- Timezone ----
    timezone="UTC",
    enable_utc=True,

    # ---- Reliability ----
    task_track_started=True,
    task_acks_late=True,         # ack only after the task body runs
    worker_prefetch_multiplier=1,  # one task at a time per worker process

    # ---- Result TTL — keep results 24 h for WebSocket late-joiners ----
    result_expires=86_400,

    # ---- Rate limits (per worker) ----
    # Protects against hammering Serper / ScraperAPI / xAI
    task_annotations={
        "app.worker.dress_tasks.process_dress_search": {
            "rate_limit": "30/m",
        }
    },
)
