"""
serper_client.py
------------------
Thin async wrapper around the Serper.dev Google Shopping API.

Serper Shopping returns structured product data (title, price, thumbnail,
merchant, product URL) without requiring us to scrape raw HTML.  We use
this as our primary data source; ScraperAPI is the fallback for richer
product descriptions.

Endpoint: POST https://google.serper.dev/shopping
"""

from __future__ import annotations

import logging
from typing import Any
import asyncio

import httpx

from app.config.settings import settings

logger = logging.getLogger("api_security")

# Maximum time (seconds) to wait for a Serper response before giving up.
_REQUEST_TIMEOUT_S: float = 15.0

# Serper returns items in "shopping" key; each item has these fields we care
# about (others like rating, reviewsCount are also available but optional).
_REQUIRED_FIELDS = ("title", "link")


class SerperShoppingService:
    """
    Async client for the Serper Google Shopping endpoint.

    Usage
    -----
    ::
        service = SerperShoppingService()
        products = await service.search("ivory chiffon maxi dress for beach wedding")
    """

    def __init__(self) -> None:
        self._base_url = "https://google.serper.dev/shopping"
        self._api_key = settings.SERPER_APIKEY
        self._headers = {
            "X-API-KEY": self._api_key,
            "Content-Type": "application/json",
        }

    async def search(
        self,
        query: str,
        num_results: int = 10,
        country: str = "us",
    ) -> list[dict]:
        if not self._api_key:
            logger.error("SerperShoppingService: SERPER_APIKEY is not configured")
            return []

        payload = {
            "q": query,
            "num": num_results,
            "gl": country,
            "type": "shopping",
        }

        backoff_delays = (1, 2, 4)

        for attempt, delay in enumerate((*backoff_delays, None), start=1):
            try:
                async with httpx.AsyncClient(timeout=_REQUEST_TIMEOUT_S) as client:
                    response = await client.post(
                        self._base_url,
                        headers=self._headers,
                        json=payload,
                    )

                if response.status_code == 429:
                    if delay is None:
                        logger.error(
                            "SerperShoppingService: rate-limited after %d attempts, giving up",
                            attempt,
                        )
                        return []
                    logger.warning(
                        "SerperShoppingService: 429 (attempt %d), backing off %ds",
                        attempt, delay,
                    )
                    await asyncio.sleep(delay)
                    continue

                response.raise_for_status()
                data: dict = response.json()
                raw_items: list[dict] = data.get("shopping", [])
                return [self._normalise(item) for item in raw_items if self._is_valid(item)]

            except httpx.TimeoutException:
                logger.error(
                    "SerperShoppingService: request timed out (attempt %d) for query=%r",
                    attempt, query,
                )
                if delay is None:
                    return []
                await asyncio.sleep(delay)
                continue

            except httpx.HTTPStatusError as exc:
                logger.error(
                    "SerperShoppingService: HTTP %s for query=%r — %s",
                    exc.response.status_code, query, exc.response.text[:200],
                )
                return []

            except Exception as exc:
                logger.exception("SerperShoppingService: unexpected error — %s", exc)
                return []

        return []

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _is_valid(item: dict) -> bool:
        """Return True only if all required fields are present and non-empty."""
        return all(item.get(f) for f in _REQUIRED_FIELDS)

    @staticmethod
    def _normalise(item: dict) -> dict[str, Any]:
        """
        Map Serper field names to our internal canonical names and keep
        the full raw item for audit / fallback purposes.
        """
        return {
            "productName": item.get("title", ""),
            "price": item.get("price", ""),
            "imageUrl": item.get("imageUrl") or item.get("thumbnailUrl", ""),
            "productUrl": item.get("link", ""),
            "brand": item.get("source", ""),  # Serper "source" = merchant name
            "_raw": item,
        }


# Module-level singleton — re-use across requests (shares no mutable state).
serper_shopping = SerperShoppingService()
