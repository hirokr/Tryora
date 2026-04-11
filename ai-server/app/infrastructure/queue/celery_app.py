from celery import Celery

from app.config.settings import settings

celery_app = Celery(
    "tryora_ai",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=[
        "app.modules.dress_search.workers",
        "app.modules.try_on.workers",
        "app.modules.prebake.workers",
        "app.modules.avatar.workers",   # ← added
    ],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    result_expires=86_400,
    task_annotations={
        "app.worker.dress_tasks.process_dress_search": {
            "rate_limit": "30/m",
        }
    },
)