"""
scraper_api_client.py — ScraperAPI client with JSON-LD extraction
------------------------------------------------------------------
Used as fallback enrichment when Serper lacks product descriptions.
"""
from __future__ import annotations

import asyncio
import logging
from typing import Any, Optional

import httpx

from app.config.settings import settings

logger = logging.getLogger("api_security")

_REQUEST_TIMEOUT_S: float = 20.0
_BACKOFF_DELAYS = (1, 2, 4)


class ScraperAPIService:
    """Fetches product pages via ScraperAPI and extracts JSON-LD structured data."""

    def __init__(self) -> None:
        self._api_key = settings.SCRAPER_API_KEY
        self._base_url = "http://api.scraperapi.com"

    async def extract_json_ld(self, product_url: str) -> Optional[dict[str, Any]]:
        """
        Fetch a product page via ScraperAPI and return the first
        Schema.org/Product JSON-LD block found, or None on failure.
        """
        if not self._api_key:
            logger.warning("ScraperAPIService: SCRAPER_API_KEY not configured — skipping")
            return None

        params = {
            "api_key": self._api_key,
            "url": product_url,
            "render": "true",
        }

        for attempt, delay in enumerate((*_BACKOFF_DELAYS, None), start=1):
            try:
                async with httpx.AsyncClient(timeout=_REQUEST_TIMEOUT_S) as client:
                    response = await client.get(self._base_url, params=params)

                if response.status_code == 429:
                    if delay is None:
                        logger.error(
                            "ScraperAPIService: rate-limited after %d attempts for %s",
                            attempt, product_url[:80],
                        )
                        return None
                    logger.warning(
                        "ScraperAPIService: 429 (attempt %d), backing off %ds",
                        attempt, delay,
                    )
                    await asyncio.sleep(delay)
                    continue

                if response.status_code != 200:
                    logger.warning(
                        "ScraperAPIService: HTTP %s for %s",
                        response.status_code, product_url[:80],
                    )
                    return None

                return self._extract_json_ld_from_html(response.text, product_url)

            except httpx.TimeoutException:
                logger.warning(
                    "ScraperAPIService: timeout (attempt %d) for %s",
                    attempt, product_url[:80],
                )
                if delay is None:
                    return None
                await asyncio.sleep(delay)
                continue

            except Exception as exc:
                logger.exception("ScraperAPIService: unexpected error — %s", exc)
                return None

        return None

    @staticmethod
    def _extract_json_ld_from_html(
        html: str, url: str
    ) -> Optional[dict[str, Any]]:
        """Parse JSON-LD Product schema from raw HTML."""
        import json
        import re

        # Find all <script type="application/ld+json"> blocks
        pattern = re.compile(
            r'<script[^>]+type=["\']application/ld\+json["\'][^>]*>(.*?)</script>',
            re.DOTALL | re.IGNORECASE,
        )

        for match in pattern.finditer(html):
            raw = match.group(1).strip()
            try:
                data = json.loads(raw)
                # Handle both single object and @graph arrays
                if isinstance(data, list):
                    for item in data:
                        if isinstance(item, dict) and "Product" in str(item.get("@type", "")):
                            item["_source_url"] = url
                            return item
                elif isinstance(data, dict):
                    if "Product" in str(data.get("@type", "")):
                        data["_source_url"] = url
                        return data
                    # @graph wrapper
                    for item in data.get("@graph", []):
                        if isinstance(item, dict) and "Product" in str(item.get("@type", "")):
                            item["_source_url"] = url
                            return item
            except (json.JSONDecodeError, Exception):
                continue

        return None


# Singleton
scraper_api = ScraperAPIService()