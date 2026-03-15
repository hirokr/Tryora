"""
jobs.py — DB queries for GenerationJob.
"""
from __future__ import annotations

from typing import TYPE_CHECKING, Optional

if TYPE_CHECKING:
    from prisma import Prisma


async def get_job_by_id(job_id: str, user_id: str, db: "Prisma") -> Optional[object]:
    """
    Return a GenerationJob owned by user_id. Returns None on miss or ownership mismatch.
    Uses ownership check to prevent enumeration attacks (returns None, not 403).
    """
    return await db.generationjob.find_first(
        where={"id": job_id, "userId": user_id}
    )


async def list_user_jobs(user_id: str, db: "Prisma", limit: int = 20) -> list:
    """Return most recent N jobs for a user."""
    return await db.generationjob.find_many(
        where={"userId": user_id},
        order={"createdAt": "desc"},
        take=limit,
    )
