"""
templates.py — DB queries for DressTemplate.
"""
from __future__ import annotations

from typing import TYPE_CHECKING, Optional

if TYPE_CHECKING:
    from prisma import Prisma


async def list_templates(
    db: "Prisma",
    category: Optional[str] = None,
    body_label: Optional[str] = None,
    ethnicity: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list, int]:
    """Return (items, total) for the given filters."""
    where: dict = {"isActive": True}
    if category:
        where["category"] = category
    if body_label:
        where["bodyLabel"] = body_label
    if ethnicity:
        where["ethnicity"] = ethnicity

    skip = (page - 1) * page_size
    items = await db.dresstemplate.find_many(
        where=where,
        take=page_size,
        skip=skip,
        order={"createdAt": "desc"},
    )
    total = await db.dresstemplate.count(where=where)
    return items, total


async def get_template_by_id(template_id: str, db: "Prisma") -> Optional[object]:
    """Return an active DressTemplate by ID, or None."""
    return await db.dresstemplate.find_first(
        where={"id": template_id, "isActive": True}
    )
