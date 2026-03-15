"""
admin.py — /api/admin/* routes  (admin-only)
---------------------------------------------
GET    /api/admin/cache/stats    — Redis memory + key counts
DELETE /api/admin/cache/flush    — flush all GLB-related keys
POST   /api/admin/templates/seed — trigger pre-bake job for a template
"""
from __future__ import annotations

import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.api.deps import get_db
from app.db.queries.templates import get_template_by_id
from app.infrastructure.cache.cache_service import CacheService
from app.shared.security.jwt import TokenPayload, get_current_admin

logger = logging.getLogger("api.admin")

router = APIRouter(tags=["Admin"])


def _get_cache(request: Request) -> CacheService:
    cache: CacheService | None = getattr(request.app.state, "cache", None)
    if cache is None:
        raise HTTPException(status_code=503, detail="Cache service unavailable")
    return cache


# ── GET /api/admin/cache/stats ------------------------------------------------

@router.get(
    "/admin/cache/stats",
    summary="Admin: Redis memory & key counts",
)
async def cache_stats(
    request: Request,
    current_admin: Annotated[TokenPayload, Depends(get_current_admin)],
) -> dict:
    cache = _get_cache(request)
    stats = await cache.get_stats()
    return {"status": "ok", "stats": stats}


# ── DELETE /api/admin/cache/flush ---------------------------------------------

@router.delete(
    "/admin/cache/flush",
    status_code=status.HTTP_200_OK,
    summary="Admin: flush all GLB cache keys (glb:*)",
)
async def flush_cache(
    request: Request,
    current_admin: Annotated[TokenPayload, Depends(get_current_admin)],
) -> dict:
    cache = _get_cache(request)
    deleted = await cache.delete_pattern("glb:*")
    logger.info("Admin %s flushed %d GLB cache keys", current_admin.user_id, deleted)
    return {"status": "ok", "deletedKeys": deleted}


# ── POST /api/admin/templates/seed/{template_id} -------------------------

@router.post(
    "/admin/templates/{template_id}/prebake",
    status_code=status.HTTP_202_ACCEPTED,
    summary="Admin: enqueue a pre-bake job for a template",
)
async def prebake_template(
    template_id: str,
    request: Request,
    current_admin: Annotated[TokenPayload, Depends(get_current_admin)],
    db=Depends(get_db),
) -> dict:
    template = await get_template_by_id(template_id, db)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    try:
        from app.modules.prebake.workers import prebake_template_glb  # deferred import
        prebake_template_glb.delay(template_id)
    except Exception as exc:
        logger.exception("Failed to enqueue prebake for template %s", template_id)
        raise HTTPException(status_code=500, detail="Failed to enqueue pre-bake task") from exc

    return {"status": "accepted", "templateId": template_id, "message": "Pre-bake job enqueued"}
