"""
consent_service.py — GDPR Consent Recording & Right-to-Erasure
---------------------------------------------------------------
Implements:
  record_consent() — creates ConsentRecord, enables sensitive field writes
  gdpr_erase()     — 4-step erasure flow per context.md §9.5

All steps run sequentially. If any step fails, the error is logged and the
remaining steps still execute (best-effort erasure).
Returns a UUID ticket_id for support reference.
"""
from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from prisma import Prisma
    from app.infrastructure.cache.cache_service import CacheService
    from app.infrastructure.storage.s3 import S3Service

logger = logging.getLogger("api_security")

VALID_CONSENT_TYPES = frozenset({"ETHNICITY_DATA", "IMAGE_PROCESSING", "BODY_DATA"})


async def record_consent(
    user_id: str,
    consent_type: str,
    granted: bool,
    ip_address: str,
    user_agent: str,
    db: "Prisma",
) -> dict:
    """
    Record a consent decision.
    If granted=True and consent_type=ETHNICITY_DATA, sets UserProfile.consentGiven=True.
    Creates a ConsentRecord every call (full audit trail — idempotent is by design kept
    as multiple records for legal traceability).
    """
    if consent_type not in VALID_CONSENT_TYPES:
        raise ValueError(f"Invalid consent_type: {consent_type!r}. Must be one of {VALID_CONSENT_TYPES}")

    record = await db.consentrecord.create(
        data={
            "userId": user_id,
            "consentType": consent_type,
            "granted": granted,
            "ipAddress": ip_address,
            "userAgent": user_agent,
        }
    )

    # Activate consent marker on profile when a consent is granted.
    if granted:
        await db.userprofile.upsert(
            where={"userId": user_id},
            data={
                "create": {
                    "userId": user_id,
                    "consentGiven": True,
                    "consentAt": datetime.now(timezone.utc),
                },
                "update": {
                    "consentGiven": True,
                    "consentAt": datetime.now(timezone.utc),
                },
            },
        )
        logger.info("GDPR consent granted: %s for user=%s", consent_type, user_id)

    return {
        "consentType": record.consentType,
        "granted": record.granted,
        "recordedAt": record.createdAt.isoformat(),
    }


async def gdpr_erase(
    user_id: str,
    db: "Prisma",
    cache: "CacheService",
    s3: "S3Service",
) -> str:
    """
    Full GDPR right-to-erasure flow.

    Step 1: Soft-delete UserProfile, zero all sensitive fields
    Step 2: Purge Redis keys matching glb:*:{user_id}*
    Step 3: Delete S3 prefix uploads/dresses/{user_id}/
    Step 4: Zero personal data in ConsentRecords (retain existence for audit)

    All steps are attempted regardless of individual failures.
    Returns a UUID ticket_id for the deletion request.
    """
    ticket_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)

    logger.info("GDPR erase initiated: user=%s ticket=%s", user_id, ticket_id)

    # Step 1 — Soft-delete & nullify sensitive fields
    try:
        await db.userprofile.upsert(
            where={"userId": user_id},
            data={
                "create": {
                    "userId": user_id,
                    "deletedAt": now,
                    "ethnicity": None,
                    "gender": None,
                    "location": None,
                    "preferences": None,
                    "consentGiven": False,
                },
                "update": {
                    "deletedAt": now,
                    "ethnicity": None,
                    "gender": None,
                    "location": None,
                    "preferences": None,
                    "consentGiven": False,
                },
            },
        )
        logger.info("GDPR erase step 1 (profile soft-delete): user=%s ticket=%s", user_id, ticket_id)
    except Exception as exc:
        logger.error("GDPR erase step 1 FAILED: user=%s ticket=%s error=%s", user_id, ticket_id, exc)

    # Step 2 — Purge Redis GLB keys
    try:
        pattern = f"glb:*:{user_id}*"
        deleted_count = await cache.delete_pattern(pattern)
        logger.info(
            "GDPR erase step 2 (Redis purge): user=%s ticket=%s deleted=%d",
            user_id,
            ticket_id,
            deleted_count,
        )
    except Exception as exc:
        logger.error("GDPR erase step 2 FAILED: user=%s ticket=%s error=%s", user_id, ticket_id, exc)

    # Step 3 — Delete S3 upload prefix
    try:
        prefix = f"uploads/dresses/{user_id}/"
        s3_deleted = await s3.purge_prefix(prefix)
        logger.info(
            "GDPR erase step 3 (S3 purge): user=%s ticket=%s deleted=%d",
            user_id,
            ticket_id,
            s3_deleted,
        )
    except Exception as exc:
        logger.error("GDPR erase step 3 FAILED: user=%s ticket=%s error=%s", user_id, ticket_id, exc)

    # Step 4 — Zero personal data in ConsentRecords (retain record existence for audit)
    try:
        await db.consentrecord.update_many(
            where={"userId": user_id},
            data={"ipAddress": None, "userAgent": None},
        )
        logger.info("GDPR erase step 4 (consent record anonymisation): user=%s ticket=%s", user_id, ticket_id)
    except Exception as exc:
        logger.error("GDPR erase step 4 FAILED: user=%s ticket=%s error=%s", user_id, ticket_id, exc)

    logger.info("GDPR erase complete: user=%s ticket=%s", user_id, ticket_id)
    return ticket_id
