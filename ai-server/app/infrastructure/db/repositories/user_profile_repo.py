"""
profile.py — DB queries for UserProfile.
"""
from __future__ import annotations

from typing import TYPE_CHECKING, Optional

if TYPE_CHECKING:
    from prisma import Prisma


async def get_profile(user_id: str, db: "Prisma") -> Optional[object]:
    """Return UserProfile for user_id, or None if not found / soft-deleted."""
    return await db.userprofile.find_first(
        where={"userId": user_id, "deletedAt": None}
    )


async def upsert_profile(user_id: str, data: dict, db: "Prisma") -> object:
    """Create or update the UserProfile for user_id. Returns the updated record."""
    return await db.userprofile.upsert(
        where={"userId": user_id},
        data={"create": {"userId": user_id, **data}, "update": data},
    )


async def check_consent(user_id: str, consent_type: str, db: "Prisma") -> bool:
    """Return True if a granted ConsentRecord exists for the given type."""
    record = await db.consentrecord.find_first(
        where={"userId": user_id, "consentType": consent_type, "granted": True},
        order={"createdAt": "desc"},
    )
    return record is not None
