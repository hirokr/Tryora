"""
prebake_task.py — Celery task: pre-bake catalog template GLBs
--------------------------------------------------------------
Pipeline (9 steps for each template):
  1. Load template metadata from DB
  2. Check if GLB is already cached (Redis + S3)
  3. Fetch template's reference thumbnail / source image
  4. Call Tripo AI image-to-3D
  5. Poll until done
  6. Download the resulting GLB
  7. Cache in Redis (GLB bytes, 1-hour TTL)
  8. Upload to S3 at catalog key
  9. Update DressTemplate.glbSource in DB

Triggered manually via POST /api/admin/templates/{id}/prebake
or bulk-baked via scripts/seed_templates.py.
"""
from __future__ import annotations

import asyncio
import logging
from typing import Any

from celery import Task

from app.worker.celery_app import celery_app

logger = logging.getLogger("worker.prebake")


async def _run_prebake(template_id: str) -> None:
    from app.core.config import settings
    from app.db.prisma_connect import db
    from app.db.queries.templates import get_template_by_id
    from app.services.cache import CacheService
    from app.services.glb_loader import load_glb
    from app.services.s3_service import s3_service
    from app.services.tripo_client import OfflineModeError, TripoAPIError, TripoTaskFailed, tripo_client

    redis_client = None
    cache = None

    try:
        import redis.asyncio as aioredis
        redis_client = aioredis.from_url(settings.REDIS_URL, decode_responses=False)
        cache = CacheService(redis_client)
    except Exception as exc:
        logger.warning("Redis unavailable in prebake worker: %s", exc)

    if not db.is_connected():
        await db.connect()

    # ── Step 1: load template ────────────────────────────────────────────────
    template = await get_template_by_id(template_id, db)
    if not template:
        logger.error("Prebake: template %s not found", template_id)
        return

    body_label = template.bodyLabel or "universal"

    # ── Step 2: cache check ──────────────────────────────────────────────────
    if cache:
        cache_key = cache.key_template_dress(template_id, body_label)
        existing = await cache.get_glb(cache_key)
        if existing:
            logger.info("Prebake: template %s already cached; skipping", template_id)
            return

    # ── Step 3-6: Tripo generation ───────────────────────────────────────────
    glb_bytes: bytes | None = None

    try:
        if template.glbSource and template.glbSource.startswith(("s3:", "url:", "local:")):
            # Already has a GLB source — just load & warm cache
            glb_bytes = await load_glb(template.glbSource, cache=cache, s3=s3_service)
        elif template.thumbnailUrl:
            # Generate from thumbnail
            logger.info("Prebake: generating GLB for template %s via Tripo", template_id)
            task_id = await tripo_client.image_to_3d(template.thumbnailUrl)
            result = await tripo_client.poll_until_done(task_id, max_wait=300, interval=5)
            glb_url = (
                result.get("output", {}).get("pbr_model")
                or result.get("output", {}).get("model")
            )
            if not glb_url:
                raise TripoTaskFailed(task_id, "No model URL in Tripo result")
            glb_bytes = await tripo_client.download_glb(glb_url)
        else:
            logger.warning("Prebake: template %s has no thumbnailUrl and no existing GLB; skipping", template_id)
            return

    except OfflineModeError:
        logger.info("Offline mode: skipping Tripo call for template %s", template_id)
        placeholder = f"local:{settings.LOCAL_GLB_DIR}/placeholder.glb"
        try:
            glb_bytes = await load_glb(placeholder, cache=cache, s3=s3_service)
        except Exception:
            glb_bytes = b""

    except (TripoAPIError, TripoTaskFailed, Exception) as exc:
        logger.exception("Prebake failed for template %s: %s", template_id, exc)
        return

    if not glb_bytes:
        logger.warning("Prebake: empty GLB for template %s; aborting", template_id)
        return

    # ── Step 7: warm Redis cache ─────────────────────────────────────────────
    if cache:
        cache_key = cache.key_template_dress(template_id, body_label)
        await cache.set_glb(cache_key, glb_bytes, ttl=3600)
        logger.info("Prebake: cached template %s in Redis (%d bytes)", template_id, len(glb_bytes))

    # ── Step 8: upload to S3 catalog path ────────────────────────────────────
    s3_key = s3_service.key_catalog_variant(template_id, body_label)
    try:
        await s3_service.upload_bytes(glb_bytes, s3_key, "model/gltf-binary")
        logger.info("Prebake: uploaded template %s to S3 → %s", template_id, s3_key)
    except Exception as exc:
        logger.exception("Prebake S3 upload failed for template %s: %s", template_id, exc)
        return

    # ── Step 9: update DressTemplate.glbSource in DB ─────────────────────────
    new_source = f"s3:{settings.S3_BUCKET}/{s3_key}"
    try:
        await db.dresstemplate.update(
            where={"id": template_id},
            data={"glbSource": new_source},
        )
        logger.info("Prebake: updated DressTemplate %s glbSource → %s", template_id, new_source)
    except Exception as exc:
        logger.warning("Prebake DB update failed for template %s: %s", template_id, exc)

    if redis_client:
        await redis_client.aclose()


# ---------------------------------------------------------------------------
# Celery task
# ---------------------------------------------------------------------------

@celery_app.task(
    bind=True,
    name="app.workers.prebake_task.prebake_template_glb",
    max_retries=1,
    default_retry_delay=60,
    rate_limit="10/m",
    acks_late=True,
)
def prebake_template_glb(self: Task, template_id: str) -> dict[str, Any]:
    """Celery entry-point for pre-baking a single template GLB."""
    logger.info("Starting prebake task template_id=%s", template_id)
    try:
        asyncio.run(_run_prebake(template_id))
        return {"status": "completed", "templateId": template_id}
    except Exception as exc:
        logger.exception("Unhandled exception in prebake task %s", template_id)
        raise self.retry(exc=exc) from exc
