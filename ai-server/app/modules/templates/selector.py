"""
template_selector.py — 3-Tier DressTemplate Lookup
----------------------------------------------------
Priority order (from context.md §3.2):

  Tier 1: exact match — ethnicity + bodyLabel (only when consent given)
  Tier 2: bodyLabel match (ethnicity ignored / universal)
  Tier 3: universal — no bodyLabel and no ethnicity constraint

Returns None if no template found → caller invokes Tripo AI.
Result is cached in Redis for 10 minutes.
"""
from __future__ import annotations

import logging
from typing import TYPE_CHECKING, Optional

from app.config.settings import settings

if TYPE_CHECKING:
    from prisma import Prisma
    from app.infrastructure.cache.cache_service import CacheService

logger = logging.getLogger("api_security")

_CACHE_TTL = 600  # 10 minutes


async def select_best_template(
    user_id: str,
    body_label: str | None,
    category: str,
    ethnicity: str | None,
    consent_given: bool,
    db: "Prisma",
    cache: "CacheService",
) -> Optional[dict]:
    """
    Return the best-matching DressTemplate dict, or None if no match found.

    The *ethnicity* parameter is only used when *consent_given* is True.
    Body type is always considered independently.
    """
    cache_key = cache.key_template_select(user_id, category)

    # Check Redis cache
    cached = await cache.get_json(cache_key)
    if cached is not None:
        logger.debug("template_selector: cache hit for user=%s category=%s", user_id, category)
        return cached

    template = None

    # Tier 1: exact ethnicity + bodyLabel match (requires consent)
    if consent_given and ethnicity and body_label:
        template = await db.dresstemplate.find_first(
            where={
                "category": category,
                "isActive": True,
                "ethnicity": ethnicity,
                "bodyLabel": body_label,
            }
        )

    # Tier 2: bodyLabel match (ethnicity-agnostic / universal)
    if template is None and body_label:
        template = await db.dresstemplate.find_first(
            where={
                "category": category,
                "isActive": True,
                "bodyLabel": body_label,
                "ethnicity": None,
            }
        )

    # Tier 3: fully universal template
    if template is None:
        template = await db.dresstemplate.find_first(
            where={
                "category": category,
                "isActive": True,
                "bodyLabel": None,
                "ethnicity": None,
            }
        )

    if template is None:
        logger.info(
            "template_selector: no template found for user=%s category=%s bodyLabel=%s",
            user_id,
            category,
            body_label,
        )
        return None

    result = {
        "id": template.id,
        "name": template.name,
        "category": template.category,
        "ethnicity": template.ethnicity,
        "bodyLabel": template.bodyLabel,
        "glbS3Key": template.glbS3Key,
        "thumbnailUrl": template.thumbnailUrl,
    }

    # Cache the result
    await cache.set_json(cache_key, result, ttl_seconds=_CACHE_TTL)
    return result
