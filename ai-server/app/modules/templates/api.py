"""
templates.py — /api/3d/templates/* routes
------------------------------------------
GET  /api/3d/templates            — list dress templates (paginated)
GET  /api/3d/templates/{id}       — get a single template metadata
GET  /api/3d/templates/{id}/glb   — stream binary GLB (cache-first)
"""
from __future__ import annotations

import logging
from typing import Annotated, Any, Optional, cast

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
from fastapi.responses import Response

from app.api.deps import get_db
from app.infrastructure.db.repositories.template_repo import get_template_by_id, list_templates
from app.shared.security.jwt import TokenPayload, get_current_user
from app.modules.templates.schemas import DressTemplateListResponse, DressTemplateResponse
from app.infrastructure.cache.cache_service import CacheService
from app.infrastructure.storage.glb_loader import load_glb
from app.infrastructure.storage.storage_service import storage_service

logger = logging.getLogger("api.templates")

router = APIRouter(tags=["3D Templates"])

_PAGE_LIMIT = 50


def _get_cache(request: Request) -> CacheService:
    cache: CacheService | None = getattr(request.app.state, "cache", None)
    if cache is None:
        raise HTTPException(status_code=503, detail="Cache service unavailable")
    return cache


# ── GET /api/3d/templates -----------------------------------------------------

@router.get(
    "/3d/templates",
    response_model=DressTemplateListResponse,
    summary="List pre-baked dress templates",
)
async def list_dress_templates(
    current_user: Annotated[TokenPayload, Depends(get_current_user)],
    category: Optional[str] = None,
    body_label: Optional[str] = None,
    ethnicity: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
    db=Depends(get_db),
) -> DressTemplateListResponse:
    if page < 1:
        page = 1
    if not (1 <= page_size <= _PAGE_LIMIT):
        page_size = 20

    items, total = await list_templates(
        db=db,
        category=category,
        body_label=body_label,
        ethnicity=ethnicity,
        page=page,
        page_size=page_size,
    )

    template_list = [
        DressTemplateResponse(
            id=t.id,
            name=t.name,
            category=t.category,
            bodyLabel=t.bodyLabel,
            ethnicity=t.ethnicity,
            thumbnailUrl=t.thumbnailUrl if t.thumbnailUrl else None,
            isActive=t.isActive,
            createdAt=t.createdAt,
        )
        for t in items
    ]

    return DressTemplateListResponse(
        items=template_list,
        total=total,
        page=page,
        pageSize=page_size,
    )


# ── GET /api/3d/templates/{id} ------------------------------------------------

@router.get(
    "/3d/templates/{template_id}",
    response_model=DressTemplateResponse,
    summary="Get a single template's metadata",
)
async def get_template(
    template_id: str,
    current_user: Annotated[TokenPayload, Depends(get_current_user)],
    db=Depends(get_db),
) -> DressTemplateResponse:
    template = await get_template_by_id(template_id, db)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    template_obj = cast(Any, template)

    return DressTemplateResponse(
        id=template_obj.id,
        name=template_obj.name,
        category=template_obj.category,
        bodyLabel=template_obj.bodyLabel,
        ethnicity=template_obj.ethnicity,
        thumbnailUrl=template_obj.thumbnailUrl if template_obj.thumbnailUrl else None,
        isActive=template_obj.isActive,
        createdAt=template_obj.createdAt,
    )


# ── GET /api/3d/templates/{id}/glb --------------------------------------------

@router.get(
    "/3d/templates/{template_id}/glb",
    summary="Stream the binary GLB for a template (cache-first)",
)
async def get_template_glb(
    template_id: str,
    request: Request,
    background_tasks: BackgroundTasks,
    current_user: Annotated[TokenPayload, Depends(get_current_user)],
    db=Depends(get_db),
) -> Response:
    cache = _get_cache(request)

    template = await get_template_by_id(template_id, db)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    template_obj = cast(Any, template)

    if not template_obj.glbSource:
        raise HTTPException(status_code=404, detail="No GLB available for this template")

    # Build cache key using template id + bodyLabel
    body_label = template_obj.bodyLabel or "universal"
    cache_key = cache.key_template_dress(template_id, body_label)

    glb_bytes: bytes | None = await cache.get_glb(cache_key)

    if glb_bytes is None:
        # Load from source (s3: / url: / local: / redis:)
        try:
            glb_bytes = await load_glb(template_obj.glbSource, cache=cache, s3=storage_service)
        except FileNotFoundError:
            raise HTTPException(status_code=404, detail="GLB file not found")
        except NotImplementedError:
            raise HTTPException(
                status_code=501, detail="Local file serving not available in production mode"
            )

        # Write-back to Redis cache in background
        background_tasks.add_task(cache.set_glb, cache_key, glb_bytes)

    return Response(
        content=glb_bytes,
        media_type="model/gltf-binary",
        headers={
            "Content-Length": str(len(glb_bytes)),
            "Cache-Control": "public, max-age=3600",
            "Content-Disposition": f'attachment; filename="{template_id}.glb"',
        },
    )
