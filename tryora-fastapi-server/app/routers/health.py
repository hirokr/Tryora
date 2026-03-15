from celery.result import AsyncResult
from fastapi import APIRouter

from app.core.celery_app import celery_app


router = APIRouter(tags=["health"])


@router.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/health/celery")
def celery_health_check() -> dict[str, str]:
    inspector = celery_app.control.inspect(timeout=1.0)
    ping_result = inspector.ping() if inspector else None
    if ping_result:
        return {"status": "ok"}
    return {"status": "degraded"}
