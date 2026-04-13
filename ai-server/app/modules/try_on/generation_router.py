"""
generation_router.py — Multi-Provider Avatar Generation Router
---------------------------------------------------------------
Implements a 5-tier fallback cascade to distribute load and minimise cost:

  Tier 0  Redis / S3 cache            — free, <50ms, always checked first
  Tier 1  SMPL-X (local CPU)          — free, ~10s, needs tHeight+tFullness
  Tier 2  HuggingFace Spaces ZeroGPU  — free, ~60s, needs image URL
  Tier 3  Tripo AI                    — ~$0.01/call, needs image URL
  Tier 4  Pre-baked template (S3)     — free, instant, always available

Each tier is attempted in order. On any error the router logs the failure
and immediately tries the next tier. The caller always gets GLB bytes back
(Tier 4 is guaranteed to succeed as long as at least one template exists).

Fixes applied:
  - app.services.tripo_client                → app.infrastructure.external.tripo_client
  - app.modules.try_on.providers.smplx_provider → app.modules.try_on.smplx_provider
  - app.modules.try_on.providers.hf_provider    → app.modules.try_on.hf_provider
  - TYPE_CHECKING: app.infrastructure.storage.s3.S3Service
                 → app.infrastructure.storage.storage_service.StorageService
  - upload_bytes(image_bytes, temp_key, ...) → upload_bytes(temp_key, image_bytes, ...)
"""
from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import TYPE_CHECKING, Optional

if TYPE_CHECKING:
    from prisma import Prisma
    from app.infrastructure.cache.cache_service import CacheService
    from app.infrastructure.storage.storage_service import StorageService

logger = logging.getLogger("worker.generation_router")


@dataclass
class GenerationResult:
    glb_bytes: bytes
    provider: str       # "cache" | "smplx" | "hf" | "tripo" | "template"
    cache_key: str
    used_fallback: bool = False


class GenerationRouter:
    """
    Orchestrates GLB generation across all available providers.

    Instantiate once per Celery task execution (it holds no mutable state
    between jobs — the model singleton lives in the individual provider modules).
    """

    def __init__(
        self,
        db: "Prisma",
        cache: "CacheService",
        s3: "StorageService",
    ) -> None:
        self._db = db
        self._cache = cache
        self._s3 = s3

    async def generate(
        self,
        job_id: str,
        user_id: str,
        t_height: Optional[float],
        t_fullness: Optional[float],
        image_s3_key: Optional[str],
        category: str = "CASUAL",
        ethnicity: Optional[str] = None,
        consent_given: bool = False,
        gender: str = "neutral",
    ) -> GenerationResult:
        """
        Run the generation cascade and return the first successful result.

        Parameters
        ----------
        job_id, user_id
            Job tracking IDs.
        t_height, t_fullness
            Normalized [0,1] body measurements from UserProfile.
            When both are present, Tier 1 (SMPL-X) is attempted.
        image_s3_key
            S3 key for a previously uploaded dress/photo image.
            When present, Tier 2 (HF Spaces) and Tier 3 (Tripo) are attempted.
        category, ethnicity, consent_given
            Passed through to the Tier 4 template selector.
        gender
            Passed to SMPL-X. "neutral" | "male" | "female".

        Returns
        -------
        GenerationResult
            Always returns a result — Tier 4 is the guaranteed fallback.
        """
        cache_key = self._cache.key_result(user_id, job_id)

        # ── Tier 0: Cache ─────────────────────────────────────────────────────
        cached = await self._try_cache(cache_key)
        if cached:
            return GenerationResult(
                glb_bytes=cached, provider="cache",
                cache_key=cache_key, used_fallback=False,
            )

        # ── Tier 1: SMPL-X (local CPU, free) ─────────────────────────────────
        if t_height is not None and t_fullness is not None:
            glb = await self._try_smplx(t_height, t_fullness, gender)
            if glb:
                await self._write_cache(cache_key, glb)
                return GenerationResult(
                    glb_bytes=glb, provider="smplx",
                    cache_key=cache_key, used_fallback=False,
                )

        # Download image bytes once (shared by Tier 2 + 3)
        image_bytes: Optional[bytes] = None
        image_url: Optional[str] = None
        if image_s3_key:
            image_bytes, image_url = await self._prepare_image(
                user_id, job_id, image_s3_key
            )

        # ── Tier 2: HuggingFace Spaces ZeroGPU (free) ────────────────────────
        if image_bytes:
            glb = await self._try_hf(image_bytes)
            if glb:
                await self._write_cache(cache_key, glb)
                return GenerationResult(
                    glb_bytes=glb, provider="hf",
                    cache_key=cache_key, used_fallback=False,
                )

        # ── Tier 3: Tripo AI (paid credits) ──────────────────────────────────
        if image_url:
            glb = await self._try_tripo(image_url)
            if glb:
                await self._write_cache(cache_key, glb)
                return GenerationResult(
                    glb_bytes=glb, provider="tripo",
                    cache_key=cache_key, used_fallback=False,
                )

        # ── Tier 4: Pre-baked template (always succeeds) ──────────────────────
        body_label: Optional[str] = None
        if t_height is not None and t_fullness is not None:
            from app.modules.try_on.body_classifier import classify_body_label
            body_label = classify_body_label(t_height, t_fullness)

        glb = await self._try_template(
            user_id=user_id,
            body_label=body_label,
            category=category,
            ethnicity=ethnicity,
            consent_given=consent_given,
        )

        if glb:
            await self._write_cache(cache_key, glb)
            return GenerationResult(
                glb_bytes=glb, provider="template",
                cache_key=cache_key, used_fallback=True,
            )

        raise RuntimeError(
            f"All generation tiers failed for job_id={job_id}. "
            "Check that at least one DressTemplate exists in the database."
        )

    # ── Private helpers ───────────────────────────────────────────────────────

    async def _try_cache(self, cache_key: str) -> Optional[bytes]:
        try:
            data = await self._cache.get_glb(cache_key)
            if data:
                logger.info("Router Tier 0 (cache) HIT  key=%s", cache_key)
            return data
        except Exception as exc:
            logger.warning("Router Tier 0 (cache) error: %s", exc)
            return None

    async def _try_smplx(
        self,
        t_height: float,
        t_fullness: float,
        gender: str,
    ) -> Optional[bytes]:
        try:
            # smplx_provider.py lives directly in app/modules/try_on/ — no providers/ subdir
            from app.modules.try_on.smplx_provider import (
                smplx_provider,
                SMPLXUnavailableError,
            )
            if not smplx_provider.is_available():
                logger.info("Router Tier 1 (SMPL-X) skipped — not installed / weights missing")
                return None
            glb = await smplx_provider.generate_glb(t_height, t_fullness, gender)
            logger.info("Router Tier 1 (SMPL-X) SUCCESS  bytes=%d", len(glb))
            return glb
        except Exception as exc:
            logger.warning("Router Tier 1 (SMPL-X) failed: %s", exc)
            return None

    async def _try_hf(self, image_bytes: bytes) -> Optional[bytes]:
        try:
            # hf_provider.py lives directly in app/modules/try_on/ — no providers/ subdir
            from app.modules.try_on.hf_provider import (
                hf_provider,
                HFSpaceUnavailableError,
            )
            glb = await hf_provider.image_to_glb(image_bytes)
            logger.info("Router Tier 2 (HF Spaces) SUCCESS  bytes=%d", len(glb))
            return glb
        except Exception as exc:
            logger.warning("Router Tier 2 (HF Spaces) failed: %s", exc)
            return None

    async def _try_tripo(self, image_url: str) -> Optional[bytes]:
        try:
            # Canonical import path — app.services.tripo_client does not exist
            from app.infrastructure.external.tripo_client import (
                tripo_client,
                OfflineModeError,
                TripoAPIError,
                TripoTaskFailed,
            )
            task_id = await tripo_client.image_to_3d(image_url)
            result = await tripo_client.poll_until_done(task_id, max_wait=300)
            glb_url = (
                result.get("output", {}).get("pbr_model")
                or result.get("output", {}).get("model")
            )
            if not glb_url:
                logger.warning("Router Tier 3 (Tripo) returned no GLB URL")
                return None
            glb = await tripo_client.download_glb(glb_url)
            logger.info("Router Tier 3 (Tripo AI) SUCCESS  bytes=%d", len(glb))
            return glb
        except Exception as exc:
            logger.warning("Router Tier 3 (Tripo AI) failed: %s", exc)
            return None

    async def _try_template(
        self,
        user_id: str,
        body_label: Optional[str],
        category: str,
        ethnicity: Optional[str],
        consent_given: bool,
    ) -> Optional[bytes]:
        try:
            from app.modules.templates.selector import select_best_template
            from app.infrastructure.storage.glb_loader import load_glb
            from app.infrastructure.storage.storage_service import storage_service

            template = await select_best_template(
                user_id=user_id,
                body_label=body_label,
                category=category,
                ethnicity=ethnicity,
                consent_given=consent_given,
                db=self._db,
                cache=self._cache,
            )
            if not template:
                logger.warning("Router Tier 4 (template) — no template found")
                return None

            # glbSource is the canonical field; fall back to glbS3Key for legacy rows
            glb_source = template.get("glbSource") or template.get("glbS3Key")
            if not glb_source:
                logger.warning("Router Tier 4 (template) — template has no GLB source")
                return None

            # Normalise bare S3 key (no scheme prefix) to s3: URI
            if not glb_source.startswith(("s3:", "url:", "local:", "redis:")):
                from app.config.settings import settings
                glb_source = f"s3:{settings.S3_BUCKET}/{glb_source}"

            glb = await load_glb(glb_source, cache=self._cache, s3=storage_service)
            logger.info(
                "Router Tier 4 (template) SUCCESS  template=%s bytes=%d",
                template.get("id"),
                len(glb),
            )
            return glb
        except Exception as exc:
            logger.warning("Router Tier 4 (template) failed: %s", exc)
            return None

    async def _prepare_image(
        self,
        user_id: str,
        job_id: str,
        s3_key: str,
    ) -> tuple[Optional[bytes], Optional[str]]:
        """Download image from S3 and generate a short-lived presigned URL for Tripo / HF."""
        try:
            image_bytes = await self._s3.download_bytes(s3_key)
            temp_key = f"temp-router/{job_id}.jpg"
            # upload_bytes(object_key, data, content_type) — object_key is first arg
            await self._s3.upload_bytes(temp_key, image_bytes, "image/jpeg")
            image_url = await self._s3.generate_presigned_url(temp_key, ttl=600)
            return image_bytes, image_url
        except Exception as exc:
            logger.warning(
                "Router: failed to prepare image from S3 key=%s: %s", s3_key, exc
            )
            return None, None

    async def _write_cache(self, cache_key: str, glb: bytes) -> None:
        try:
            await self._cache.set_glb(cache_key, glb, ttl_seconds=3600)
        except Exception as exc:
            logger.warning("Router: cache write failed key=%s: %s", cache_key, exc)