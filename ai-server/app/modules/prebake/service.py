"""Helpers for loading fallback template GLBs used by avatar and try-on workers."""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING, Any, Optional

from app.config.settings import settings
from app.infrastructure.storage.glb_loader import load_glb
from app.infrastructure.storage.storage_service import storage_service
from app.modules.templates.selector import select_best_template
from app.modules.try_on.body_classifier import classify_body_label

if TYPE_CHECKING:
	from prisma import Prisma
	from app.infrastructure.cache.cache_service import CacheService

logger = logging.getLogger("worker.prebake.service")


def _normalise_glb_source(raw_source: Optional[str]) -> Optional[str]:
	if not raw_source:
		return None
	if raw_source.startswith(("s3:", "url:", "local:", "redis:")):
		return raw_source
	return f"s3:{settings.S3_BUCKET}/{raw_source}"


def _template_to_dict(template: Any) -> dict[str, Any]:
	if isinstance(template, dict):
		return template
	return {
		"id": getattr(template, "id", None),
		"name": getattr(template, "name", None),
		"category": getattr(template, "category", None),
		"ethnicity": getattr(template, "ethnicity", None),
		"bodyLabel": getattr(template, "bodyLabel", None),
		"glbS3Key": getattr(template, "glbS3Key", None),
		"glbSource": getattr(template, "glbSource", None),
	}


async def _fallback_template_lookup(
	db: "Prisma",
	body_label: Optional[str],
) -> Any | None:
	if body_label:
		template = await db.dresstemplate.find_first(
			where={
				"isActive": True,
				"bodyLabel": body_label,
			},
			order={"createdAt": "desc"},
		)
		if template:
			return template

	template = await db.dresstemplate.find_first(
		where={
			"isActive": True,
			"bodyLabel": None,
			"ethnicity": None,
		},
		order={"createdAt": "desc"},
	)
	if template:
		return template

	return await db.dresstemplate.find_first(
		where={"isActive": True},
		order={"createdAt": "desc"},
	)


async def get_template_glb(
	user_id: str,
	t_height: Optional[float],
	t_fullness: Optional[float],
	db: "Prisma",
	cache: Optional["CacheService"],
	*,
	category: str = "CASUAL",
	ethnicity: Optional[str] = None,
	consent_given: bool = False,
) -> bytes:
	"""Return template GLB bytes for fallback avatar generation.

	Selection starts with the standard 3-tier template selector and then
	broadens to body-only / universal templates if needed.
	"""
	body_label: Optional[str] = None
	if t_height is not None and t_fullness is not None:
		body_label = classify_body_label(t_height, t_fullness)

	template: Any | None = None
	if cache is not None:
		template = await select_best_template(
			user_id=user_id,
			body_label=body_label,
			category=category,
			ethnicity=ethnicity,
			consent_given=consent_given,
			db=db,
			cache=cache,
		)

	if template is None:
		template = await _fallback_template_lookup(db, body_label)

	if template is None:
		raise FileNotFoundError("No active dress template found for fallback")

	payload = _template_to_dict(template)
	glb_source = _normalise_glb_source(payload.get("glbSource") or payload.get("glbS3Key"))
	if not glb_source:
		raise FileNotFoundError("Template exists but has no GLB source")

	if glb_source.startswith("redis:") and cache is None:
		raise RuntimeError("Cannot load redis: GLB source without cache service")

	glb_bytes = await load_glb(glb_source, cache=cache, s3=storage_service)

	if cache is not None and payload.get("id"):
		cache_label = payload.get("bodyLabel") or body_label or "universal"
		await cache.set_glb(cache.key_template_dress(str(payload["id"]), str(cache_label)), glb_bytes)

	logger.info(
		"Loaded fallback template GLB template=%s bodyLabel=%s bytes=%d",
		payload.get("id"),
		payload.get("bodyLabel") or body_label,
		len(glb_bytes),
	)
	return glb_bytes


__all__ = ["get_template_glb"]