"""
serper_shopping.py
------------------
Thin async wrapper around the Serper.dev Google Shopping API.

Serper Shopping returns structured product data (title, price, thumbnail,
merchant, product URL) without requiring us to scrape raw HTML.  We use
this as our primary data source; ScraperAPI is the fallback for richer
product descriptions.

Endpoint: POST https://google.serper.dev/shopping
"""

from __future__ import annotations

import asyncio
import logging
from typing import Any

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
        self._headers = {
            "X-API-KEY": settings.SERPER_APIKEY,
            "Content-Type": "application/json",
        }

    async def search(
        self,
        query: str,
        num_results: int = 10,
        country: str = "us",
    ) -> list[dict[str, Any]]:
        """
        Execute a Google Shopping search and return a normalised list of
        product dicts.

        Each returned dict is guaranteed to have:
        - ``productName``  — display title
        - ``price``        — price string (may be empty)
        - ``imageUrl``     — thumbnail URL (may be empty)
        - ``productUrl``   — link to the retailer page

        Additional raw fields from Serper are kept inside ``_raw``.

        Parameters
        ----------
        query:
            The search string (ideally built by :func:`build_shopping_query`).
        num_results:
            How many Shopping results to request (max 100 per Serper docs).
        country:
            Two-letter country code for localised results (default: "us").

        Returns
        -------
        list[dict]
            Normalised product list; empty list on any error.
        """
        payload = {
            "q": query,
            "num": num_results,
            "gl": country,
            "type": "shopping",
        }

        try:
            async with httpx.AsyncClient(timeout=_REQUEST_TIMEOUT_S) as client:
                response = await client.post(
                    self._base_url,
                    headers=self._headers,
                    json=payload,
                )
                response.raise_for_status()
                data: dict = response.json()

        except httpx.TimeoutException:
            logger.error("SerperShoppingService: request timed out for query=%r", query)
            return []

        except httpx.HTTPStatusError as exc:
            logger.error(
                "SerperShoppingService: HTTP %s for query=%r — %s",
                exc.response.status_code,
                query,
                exc.response.text[:200],
            )
            return []

        except Exception as exc:
            logger.exception("SerperShoppingService: unexpected error — %s", exc)
            return []

        raw_items: list[dict] = data.get("shopping", [])
        return [self._normalise(item) for item in raw_items if self._is_valid(item)]

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
