import logging
from fastapi import APIRouter, Request, status
from fastapi.responses import JSONResponse

logger = logging.getLogger("api.health")
router = APIRouter()


@router.get("/health", summary="Liveness + readiness check")
async def health_check(request: Request) -> JSONResponse:
    checks: dict[str, str] = {}
    all_ok = True

    # ── Database check ───────────────────────────────────────────────────────
    try:
        from app.db.prisma_connect import db
        if db.is_connected():
            checks["db"] = "ok"
        else:
            checks["db"] = "disconnected"
            all_ok = False
    except Exception as exc:
        logger.warning("Health: DB check failed: %s", exc)
        checks["db"] = f"error: {exc}"
        all_ok = False

    # ── Redis check ──────────────────────────────────────────────────────────
    redis = getattr(request.app.state, "redis", None)
    if redis is not None:
        try:
            await redis.ping()
            checks["redis"] = "ok"
        except Exception as exc:
            logger.warning("Health: Redis check failed: %s", exc)
            checks["redis"] = f"error: {exc}"
            all_ok = False
    else:
        checks["redis"] = "unavailable"
        # Redis being unavailable is a warning, not fatal for health endpoint
        # (degraded mode — cache-dependent features disabled)

    http_status = status.HTTP_200_OK if all_ok else status.HTTP_503_SERVICE_UNAVAILABLE
    return JSONResponse(
        status_code=http_status,
        content={"status": "ok" if all_ok else "degraded", "checks": checks},
    )

