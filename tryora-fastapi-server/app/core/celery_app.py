from celery import Celery

from app.core.config import get_settings


settings = get_settings()

celery_app = Celery(
    "tryora_tasks",
    broker=settings.redis_url,
    backend=settings.redis_url,
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
)

celery_app.autodiscover_tasks(["app.tasks"])


def celery_health_check() -> tuple[bool, str | None]:
    try:
        inspector = celery_app.control.inspect(timeout=1.0)
        ping_result = inspector.ping() if inspector else None
        if ping_result:
            return True, None
        return False, "No Celery workers responded"
    except Exception as exc:  # pragma: no cover
        return False, str(exc)
