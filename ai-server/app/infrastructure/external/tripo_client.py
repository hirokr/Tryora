"""
tripo_client.py — Async Tripo AI REST Client
---------------------------------------------
Wraps the Tripo AI v2 OpenAPI endpoints:
  POST /task    — submit image_to_model or multiview job
  GET  /task/{id} — poll job status

Rate-limit handling: exponential backoff (1s, 2s, 4s) on HTTP 429.
Timeout: raises TimeoutError after max_wait seconds.
Offline mode: raises OfflineModeError when OFFLINE_MODE=True.
"""
from __future__ import annotations

import asyncio
import logging
from typing import Optional

import httpx

from app.config.settings import settings

logger = logging.getLogger("api_security")

TRIPO_BASE = "https://api.tripo3d.ai/v2/openapi"
_BACKOFF_DELAYS = (1, 2, 4)


class OfflineModeError(Exception):
    """Raised when a Tripo API call is attempted in OFFLINE_MODE."""


class TripoAPIError(Exception):
    """Raised when Tripo returns a non-zero error code."""


class TripoTaskFailed(Exception):
    """Raised when a Tripo task status is 'failed' or 'cancelled'."""


class TripoClient:
    """Async Tripo AI API client."""

    def __init__(self) -> None:
        self._api_key: str | None = (
            getattr(settings, "TRIPO_API_KEY", None)
            or getattr(settings, "TRIPO_APIKEY", None)
        )

    def _headers(self) -> dict[str, str]:
        if not self._api_key:
            raise OfflineModeError("TRIPO_API_KEY is not set; cannot call Tripo AI")
        return {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
        }

    def _check_offline(self) -> None:
        offline_mode = bool(getattr(settings, "OFFLINE_MODE", False))
        if offline_mode or not self._api_key:
            raise OfflineModeError(
                "Tripo AI calls are disabled (OFFLINE_MODE=True or TRIPO_API_KEY missing)"
            )

    # ── Submit image-to-3D task ───────────────────────────────────────────────

    async def image_to_3d(self, image_url: str) -> str:
        """Submit a single-image image_to_model task. Returns task_id."""
        self._check_offline()

        payload = {
            "type": "image_to_model",
            "file": {"type": "url", "url": image_url},
        }

        for attempt, delay in enumerate((*_BACKOFF_DELAYS, None), start=1):
            async with httpx.AsyncClient(timeout=30) as client:
                response = await client.post(
                    f"{TRIPO_BASE}/task",
                    json=payload,
                    headers=self._headers(),
                )

            if response.status_code == 429:
                if delay is None:
                    raise TripoAPIError("Tripo rate-limit exceeded after max retries")
                logger.warning("Tripo 429 (attempt %d), backing off %ds", attempt, delay)
                await asyncio.sleep(delay)
                continue

            data = response.json()
            if response.status_code != 200 or data.get("code") != 0:
                raise TripoAPIError(
                    f"Tripo API error (status={response.status_code}, "
                    f"code={data.get('code')}, msg={data.get('message')})"
                )

            task_id: str = data["data"]["task_id"]
            logger.info("Tripo task submitted: task_id=%s", task_id)
            return task_id

        raise TripoAPIError("image_to_3d: unreachable after retries")

    # ── Avatar generation (multiview or single) ───────────────────────────────

    async def generate_avatar(
        self,
        front_image_url: str,
        side_image_url: Optional[str] = None,
        back_image_url: Optional[str] = None,
    ) -> bytes:
        """
        Generate a GLB avatar from 1–3 photos.

        Uses multiview_to_model when side or back photos are provided,
        falls back to image_to_model for a single front photo.

        Returns GLB bytes directly (polls until done + downloads).
        Raises OfflineModeError, TripoAPIError, TripoTaskFailed, TimeoutError.
        """
        self._check_offline()

        # Build the appropriate payload
        if side_image_url or back_image_url:
            # Multiview task — include all available angles
            files = [{"type": "url", "url": front_image_url, "direction": "front"}]
            if side_image_url:
                files.append({"type": "url", "url": side_image_url, "direction": "left"})
            if back_image_url:
                files.append({"type": "url", "url": back_image_url, "direction": "back"})

            payload = {
                "type": "multiview_to_model",
                "files": files,
            }
            log_tag = "multiview"
        else:
            # Single image fallback
            payload = {
                "type": "image_to_model",
                "file": {"type": "url", "url": front_image_url},
            }
            log_tag = "single"

        # Submit with backoff
        task_id: Optional[str] = None
        for attempt, delay in enumerate((*_BACKOFF_DELAYS, None), start=1):
            async with httpx.AsyncClient(timeout=30) as client:
                response = await client.post(
                    f"{TRIPO_BASE}/task",
                    json=payload,
                    headers=self._headers(),
                )

            if response.status_code == 429:
                if delay is None:
                    raise TripoAPIError("Tripo rate-limit exceeded after max retries")
                logger.warning(
                    "Tripo generate_avatar 429 (attempt %d), backing off %ds", attempt, delay
                )
                await asyncio.sleep(delay)
                continue

            data = response.json()
            if response.status_code != 200 or data.get("code") != 0:
                raise TripoAPIError(
                    f"Tripo generate_avatar error ({log_tag}, "
                    f"status={response.status_code}, "
                    f"code={data.get('code')}, msg={data.get('message')})"
                )

            task_id = data["data"]["task_id"]
            logger.info("Tripo avatar task submitted (%s): task_id=%s", log_tag, task_id)
            break

        if not task_id:
            raise TripoAPIError("generate_avatar: failed to obtain task_id after retries")

        # Poll until done
        result = await self.poll_until_done(task_id, max_wait=300, interval=5)

        # Extract GLB URL from result
        glb_url = (
            result.get("output", {}).get("pbr_model")
            or result.get("output", {}).get("model")
        )
        if not glb_url:
            raise TripoAPIError(
                f"Tripo task {task_id} completed but returned no GLB URL. "
                f"Output: {result.get('output')}"
            )

        logger.info("Tripo avatar GLB ready (%s): %s", log_tag, glb_url)
        return await self.download_glb(glb_url)

    # ── Poll task ─────────────────────────────────────────────────────────────

    async def poll_until_done(
        self,
        task_id: str,
        max_wait: int = 300,
        interval: int = 5,
    ) -> dict:
        """Poll Tripo task until status is 'success' or timeout."""
        self._check_offline()

        deadline = asyncio.get_event_loop().time() + max_wait

        async with httpx.AsyncClient(timeout=30) as client:
            while asyncio.get_event_loop().time() < deadline:
                response = await client.get(
                    f"{TRIPO_BASE}/task/{task_id}",
                    headers=self._headers(),
                )
                data = response.json()

                if response.status_code != 200 or data.get("code") != 0:
                    raise TripoAPIError(
                        f"Tripo poll error (task_id={task_id}, "
                        f"status={response.status_code}): {data}"
                    )

                task_data = data["data"]
                task_status: str = task_data.get("status", "")

                if task_status == "success":
                    logger.info("Tripo task completed: task_id=%s", task_id)
                    return task_data

                if task_status in ("failed", "cancelled"):
                    raise TripoTaskFailed(
                        f"Tripo task {task_id!r} ended with status={task_status!r}: "
                        f"{task_data.get('error_message', '')}"
                    )

                logger.debug(
                    "Tripo task=%s status=%s progress=%s",
                    task_id, task_status, task_data.get("progress"),
                )
                await asyncio.sleep(interval)

        raise TimeoutError(
            f"Tripo task {task_id!r} did not complete within {max_wait}s"
        )

    # ── Download GLB ──────────────────────────────────────────────────────────

    async def download_glb(self, glb_url: str) -> bytes:
        """Stream-download the generated GLB from Tripo CDN."""
        self._check_offline()

        chunks: list[bytes] = []
        async with httpx.AsyncClient(timeout=120) as client:
            async with client.stream("GET", glb_url) as response:
                response.raise_for_status()
                async for chunk in response.aiter_bytes(chunk_size=64 * 1024):
                    chunks.append(chunk)
        return b"".join(chunks)


# Singleton instance
tripo_client = TripoClient()