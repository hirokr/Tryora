"""
scraper_api.py
--------------
Fallback enrichment layer using ScraperAPI + BeautifulSoup.

When Serper Shopping lacks rich product descriptions (no "description"
field), we:

1. Fetch the raw HTML of the product page via ScraperAPI (which handles
   JS rendering, CAPTCHAs, proxy rotation, etc.).
2. Parse the HTML with BeautifulSoup and look for the canonical
   ``<script type="application/ld+json">`` tag that most e-commerce sites
   emit as Schema.org/Product structured data.
3. Return the parsed JSON-LD dict — NOT the raw HTML — so the LLM
   formatter never has to deal with HTML noise.

Security note: we never pass raw HTML to the LLM.  JSON-LD is already
structured and bounded in size.

Reference: https://schema.org/Product
"""

from __future__ import annotations

import json
import logging
from typing import Any, Optional

import httpx
from bs4 import BeautifulSoup

from app.config.settings import settings

logger = logging.getLogger("api_security")

# ------------------------------------------------------------------
# Constants
# ------------------------------------------------------------------

_SCRAPER_API_BASE = "https://api.scraperapi.com"
_REQUEST_TIMEOUT_S: float = 30.0  # JS rendering can be slow

# Schema.org types we consider "product-like"
_PRODUCT_TYPES = {"Product", "ProductGroup", "https://schema.org/Product"}


class ScraperAPIService:
    """
    Fetches a product page via ScraperAPI and extracts Schema.org/Product
    JSON-LD without touching raw HTML in downstream code.

    Usage
    -----
    ::
        service = ScraperAPIService()
        json_ld = await service.extract_json_ld("https://shop.example.com/dress/123")
        if json_ld:
            description = json_ld.get("description")
    """

    def __init__(self) -> None:
        self._api_key = settings.SCRAPER_API_KEY

    async def extract_json_ld(
        self,
        product_url: str,
        render_js: bool = True,
    ) -> Optional[dict[str, Any]]:
        """
        Fetch *product_url* through ScraperAPI and return the first
        Schema.org Product JSON-LD block found on the page, or *None*.

        Parameters
        ----------
        product_url:
            The e-commerce product page URL to fetch.
        render_js:
            Whether to enable ScraperAPI's JS rendering (needed for SPA
            shops like Shopify).  Costs one extra credit but dramatically
            improves extraction success rate.

        Returns
        -------
        dict | None
            Parsed JSON-LD dict, or None if not found / on any error.
        """
        params = {
            "api_key": self._api_key,
            "url": product_url,
            "render": "true" if render_js else "false",
        }

        try:
            async with httpx.AsyncClient(timeout=_REQUEST_TIMEOUT_S) as client:
                resp = await client.get(_SCRAPER_API_BASE, params=params)
                resp.raise_for_status()
                html_content = resp.text

        except httpx.TimeoutException:
            logger.warning(
                "ScraperAPIService: timeout fetching %s (timeout=%ss)",
                product_url,
                _REQUEST_TIMEOUT_S,
            )
            return None

        except httpx.HTTPStatusError as exc:
            logger.warning(
                "ScraperAPIService: HTTP %s for %s",
                exc.response.status_code,
                product_url,
            )
            return None

        except Exception as exc:
            logger.exception("ScraperAPIService: unexpected error — %s", exc)
            return None

        return self._parse_json_ld(html_content, product_url)

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _parse_json_ld(
        self,
        html: str,
        source_url: str,
    ) -> Optional[dict[str, Any]]:
        """
        Locate ``<script type="application/ld+json">`` blocks and return
        the first one whose ``@type`` maps to a Schema.org Product.

        Multiple ld+json blocks may appear (breadcrumbs, website, product,
        etc.).  We iterate all of them and pick the first Product-typed one.

        Parameters
        ----------
        html:
            Raw HTML string from ScraperAPI.
        source_url:
            Only used for log messages.

        Returns
        -------
        dict | None
        """
        try:
            soup = BeautifulSoup(html, "lxml")
        except Exception:
            # lxml may not be installed; fall back to the built-in parser
            soup = BeautifulSoup(html, "html.parser")

        ld_json_tags = soup.find_all("script", attrs={"type": "application/ld+json"})

        if not ld_json_tags:
            logger.debug("ScraperAPIService: no ld+json tags found at %s", source_url)
            return None

        for tag in ld_json_tags:
            raw_text = tag.string or tag.get_text()
            if not raw_text or not raw_text.strip():
                continue

            try:
                data = json.loads(raw_text.strip())
            except json.JSONDecodeError as exc:
                logger.debug(
                    "ScraperAPIService: failed to parse ld+json block — %s", exc
                )
                continue

            # Handle both plain objects and @graph arrays
            candidates: list[dict] = []
            if isinstance(data, dict):
                graph = data.get("@graph")
                if graph and isinstance(graph, list):
                    candidates.extend(graph)
                else:
                    candidates.append(data)
            elif isinstance(data, list):
                candidates.extend(data)

            for candidate in candidates:
                if not isinstance(candidate, dict):
                    continue
                obj_type = candidate.get("@type", "")
                # @type may be a string or a list
                types = (
                    obj_type if isinstance(obj_type, list) else [obj_type]
                )
                if any(t in _PRODUCT_TYPES for t in types):
                    logger.debug(
                        "ScraperAPIService: found Schema.org/Product at %s", source_url
                    )
                    return candidate

        logger.debug(
            "ScraperAPIService: no Schema.org/Product block found at %s", source_url
        )
        return None


# Module-level singleton
scraper_api = ScraperAPIService()
