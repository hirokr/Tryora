from fastapi import APIRouter, Response

from app.core.celery_app import celery_health_check


router = APIRouter(tags=["health"])


@router.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/health/celery")
def celery_broker_health(response: Response) -> dict[str, str]:
    ok, detail = celery_health_check()
    if ok:
        return {"broker": "ok"}

    response.status_code = 503
    return {"broker": "error", "detail": detail or "Unknown error"}
