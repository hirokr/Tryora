"""Service-level Tripo client facade.

This module keeps a stable import path used by tests and legacy code while
remaining patch-friendly (tests patch ``app.services.tripo_client.settings`` and
``app.services.tripo_client.httpx.AsyncClient``).
"""

from __future__ import annotations

import asyncio

import httpx

from app.core.config import settings

TRIPO_BASE = "https://api.tripo3d.ai/v2/openapi"
_BACKOFF_DELAYS = (1, 2, 4)


class OfflineModeError(Exception):
	pass


class TripoAPIError(Exception):
	pass


class TripoTaskFailed(Exception):
	pass


class TripoClient:
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
		if bool(getattr(settings, "OFFLINE_MODE", False)) or not self._api_key:
			raise OfflineModeError(
				"Tripo AI calls are disabled (OFFLINE_MODE=True or TRIPO_API_KEY missing)"
			)

	async def image_to_3d(self, image_url: str) -> str:
		self._check_offline()

		payload = {"type": "image_to_model", "file": {"type": "url", "url": image_url}}

		for delay in (*_BACKOFF_DELAYS, None):
			async with httpx.AsyncClient(timeout=30) as client:
				response = await client.post(
					f"{TRIPO_BASE}/task", json=payload, headers=self._headers()
				)

			if response.status_code == 429:
				if delay is None:
					raise TripoAPIError("Tripo rate-limit exceeded after max retries")
				await asyncio.sleep(delay)
				continue

			data = response.json()
			if response.status_code != 200 or data.get("code") != 0:
				raise TripoAPIError(
					f"Tripo API error (status={response.status_code}, code={data.get('code')}, msg={data.get('message')})"
				)

			return data["data"]["task_id"]

		raise TripoAPIError("image_to_3d: unreachable after retries")

	async def poll_until_done(
		self, task_id: str, max_wait: int = 300, interval: int = 5
	) -> dict:
		self._check_offline()

		deadline = asyncio.get_event_loop().time() + max_wait
		async with httpx.AsyncClient(timeout=30) as client:
			while asyncio.get_event_loop().time() < deadline:
				response = await client.get(f"{TRIPO_BASE}/task/{task_id}", headers=self._headers())
				data = response.json()

				if response.status_code != 200 or data.get("code") != 0:
					raise TripoAPIError(
						f"Tripo poll error (task_id={task_id}, status={response.status_code}): {data}"
					)

				task_data = data["data"]
				task_status: str = task_data.get("status", "")
				if task_status == "success":
					return task_data
				if task_status in ("failed", "cancelled"):
					raise TripoTaskFailed(
						f"Tripo task {task_id!r} ended with status={task_status!r}: {task_data.get('error_message', '')}"
					)

				await asyncio.sleep(interval)

		raise TimeoutError(f"Tripo task {task_id!r} did not complete within {max_wait}s")

	async def download_glb(self, glb_url: str) -> bytes:
		self._check_offline()
		chunks: list[bytes] = []
		async with httpx.AsyncClient(timeout=120) as client:
			async with client.stream("GET", glb_url) as response:
				response.raise_for_status()
				async for chunk in response.aiter_bytes(chunk_size=64 * 1024):
					chunks.append(chunk)
		return b"".join(chunks)


tripo_client = TripoClient()

__all__ = [
	"OfflineModeError",
	"TripoAPIError",
	"TripoTaskFailed",
	"TripoClient",
	"tripo_client",
]