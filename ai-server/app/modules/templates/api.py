"""
templates.py — /api/3d/templates/* routes
------------------------------------------
GET  /api/3d/templates            — list dress templates (paginated)
GET  /api/3d/templates/{id}       — get a single template metadata
GET  /api/3d/templates/{id}/glb   — stream binary GLB (cache-first)
"""
from __future__ import annotations

import logging
from typing import Annotated, Optional

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request, status
from fastapi.responses import Response, StreamingResponse

from app.api.deps import get_db
from app.db.queries.templates import get_template_by_id, list_templates
from app.middleware.auth import TokenPayload, get_current_user
from app.models.template import DressTemplateListResponse, DressTemplateResponse
from app.services.cache import CacheService
from app.services.glb_loader import load_glb
from app.services.s3_service import s3_service

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
    category: Optional[str] = None,
    body_label: Optional[str] = None,
    ethnicity: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
    current_user: Annotated[TokenPayload, Depends(get_current_user)] = None,
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
            glbSource=t.glbSource if t.glbSource else None,
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

    return DressTemplateResponse(
        id=template.id,
        name=template.name,
        category=template.category,
        bodyLabel=template.bodyLabel,
        ethnicity=template.ethnicity,
        glbSource=template.glbSource if template.glbSource else None,
        thumbnailUrl=template.thumbnailUrl if template.thumbnailUrl else None,
        isActive=template.isActive,
        createdAt=template.createdAt,
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
    if not template.glbSource:
        raise HTTPException(status_code=404, detail="No GLB available for this template")

    # Build cache key using template id + bodyLabel
    body_label = template.bodyLabel or "universal"
    cache_key = cache.key_template_dress(template_id, body_label)

    glb_bytes: bytes | None = await cache.get_glb(cache_key)

    if glb_bytes is None:
        # Load from source (s3: / url: / local: / redis:)
        try:
            glb_bytes = await load_glb(template.glbSource, cache=cache, s3=s3_service)
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
