#!/usr/bin/env python3
"""
scripts/seed_templates.py — idempotent DressTemplate seeder
------------------------------------------------------------
Creates 27+ placeholder DressTemplate rows (3 categories × 9 body labels)
and enqueues pre-bake Celery tasks for each new template.

Usage:
    python -m scripts.seed_templates            # production DB
    OFFLINE_MODE=true python -m scripts.seed_templates  # dry-run in offline mode
"""
from __future__ import annotations

import asyncio
import logging
import os
import sys

# Allow running as a top-level script
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.config.logging import logger
from app.modules.try_on.body_classifier import ALL_BODY_LABELS

logging.basicConfig(level=logging.INFO)

# ── Catalog configuration ────────────────────────────────────────────────────
CATEGORIES = ["CASUAL", "FORMAL", "TRADITIONAL"]

# Example thumbnail URLs per category (used to seed Tripo source)
CATEGORY_THUMBNAILS: dict[str, str] = {
    "CASUAL": "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=512",
    "FORMAL": "https://images.unsplash.com/photo-1594938298603-c8148c4b9d5e?w=512",
    "TRADITIONAL": "https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=512",
}

# Optional per-ethnicity variants (these get an extra 3 rows per category)
ETHNICITIES = ["asian", "black", "white", "hispanic", "south_asian"]


async def seed() -> None:
    from prisma import Prisma

    db = Prisma(auto_register=True)
    await db.connect()

    created = 0
    skipped = 0
    prebake_ids: list[str] = []

    for category in CATEGORIES:
        for body_label in ALL_BODY_LABELS:
            # ── Universal (ethnicity=None) template ──────────────────────────
            existing = await db.dresstemplate.find_first(
                where={
                    "category": category,
                    "bodyLabel": body_label,
                    "ethnicity": None,
                    "isActive": True,
                }
            )
            if existing:
                logger.info("Skip (exists): %s / %s / universal", category, body_label)
                skipped += 1
            else:
                tmpl = await db.dresstemplate.create(
                    data={
                        "name": f"{category.capitalize()} — {body_label}",
                        "category": category,
                        "bodyLabel": body_label,
                        "thumbnailUrl": CATEGORY_THUMBNAILS.get(category),
                        "isActive": True,
                    }
                )
                logger.info("Created: %s / %s / universal → %s", category, body_label, tmpl.id)
                created += 1
                prebake_ids.append(tmpl.id)

    logger.info("Seeding complete: %d created, %d skipped.", created, skipped)

    # ── Enqueue pre-bake tasks ───────────────────────────────────────────────
    if prebake_ids:
        try:
            from app.modules.prebake.workers import prebake_template_glb

            for tmpl_id in prebake_ids:
                prebake_template_glb.delay(tmpl_id)
                logger.info("Enqueued prebake for %s", tmpl_id)
            logger.info("Enqueued %d pre-bake tasks.", len(prebake_ids))
        except Exception as exc:
            logger.warning("Could not enqueue pre-bake tasks (worker may be offline): %s", exc)

    await db.disconnect()


if __name__ == "__main__":
    asyncio.run(seed())
