"""
tripo_client.py — Async Tripo AI REST Client
---------------------------------------------
Wraps the Tripo AI v2 OpenAPI endpoints:
  POST /task    — submit image_to_model job
  GET  /task/{id} — poll job status

Rate-limit handling: exponential backoff (1s, 2s, 4s) on HTTP 429.
Timeout: raises TimeoutError after max_wait seconds.
Offline mode: raises OfflineModeError when OFFLINE_MODE=True.

All exceptions include task_id where applicable for debuggability.
"""
from __future__ import annotations

import asyncio
import logging

import httpx

from app.config.settings import settings

logger = logging.getLogger("api_security")

TRIPO_BASE = "https://api.tripo3d.ai/v2/openapi"
_BACKOFF_DELAYS = (1, 2, 4)  # seconds between 429 retries


class OfflineModeError(Exception):
    """Raised when a Tripo API call is attempted in OFFLINE_MODE."""


class TripoAPIError(Exception):
    """Raised when Tripo returns a non-zero error code."""


class TripoTaskFailed(Exception):
    """Raised when a Tripo task status is 'failed' or 'cancelled'."""


class TripoClient:
    """Async Tripo AI API client."""

    def __init__(self) -> None:
        # Support both TRIPO_API_KEY and TRIPO_APIKEY naming variants.
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

    # ── Submit task ───────────────────────────────────────────────────────────

    async def image_to_3d(self, image_url: str) -> str:
        """
        Submit an image-to-3D task.
        Returns the Tripo task_id string.
        Raises OfflineModeError, TripoAPIError.
        """
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

        raise TripoAPIError("image_to_3d: unreachable after retries")  # safety

    # ── Poll task ─────────────────────────────────────────────────────────────

    async def poll_until_done(
        self,
        task_id: str,
        max_wait: int = 300,
        interval: int = 5,
    ) -> dict:
        """
        Poll the Tripo task until status is 'success' or timeout.
        Returns the task result dict on success.
        Raises TripoTaskFailed, TimeoutError.
        """
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
                    task_id,
                    task_status,
                    task_data.get("progress"),
                )
                await asyncio.sleep(interval)

        raise TimeoutError(
            f"Tripo task {task_id!r} did not complete within {max_wait}s"
        )

    # ── Download GLB ──────────────────────────────────────────────────────────

    async def download_glb(self, glb_url: str) -> bytes:
        """
        Stream-download the generated GLB from Tripo CDN.
        Does NOT use .content directly to avoid loading large files into memory at once.
        """
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
