"""
formatter.py
------------
Takes raw product data (either a Serper Shopping item dict or a
Schema.org/Product JSON-LD dict from ScraperAPI) and asks xAI to
normalise it into our canonical DressProductSchema format.

This is deliberately a *light* LLM call:
- JSON → JSON, no HTML involved.
- Temperature 0 for determinism.
- Small max_tokens to keep latency and cost low.

We do NOT call the LLM if we can derive the required fields directly from
the input — the LLM is only used to fill in fields that require semantic
understanding (e.g. cleaning up messy HTML-encoded descriptions or
inferring availability from scattered text).
"""

from __future__ import annotations

import json
import logging
from typing import Any, Optional

from openai import OpenAI
from pydantic import ValidationError

from app.config.settings import settings
from app.schemas.dress_search import DressProductSchema

logger = logging.getLogger("api_security")

_XAI_BASE_URL = "https://api.x.ai/v1"
_MODEL = "grok-3-mini"

_SYSTEM_PROMPT = """\
You are a data-cleaning assistant for the Tryora fashion platform.

You receive a raw JSON object describing a dress product (either from a
Google Shopping API or from a Schema.org/Product JSON-LD block on a product
page).  Your task is to extract and normalise the relevant fields and return
a single JSON object matching the schema below.  Do NOT include markdown,
explanations, or any text outside the JSON object.

Output schema:
{
  "product_name":  <string>,           // clean display title
  "price":         <string | null>,    // formatted price string e.g. "$149.99"
  "image_url":     <string | null>,    // direct image URL
  "product_url":   <string>,           // canonical product page URL
  "description":   <string | null>,    // concise plain-text product description (max 300 chars)
  "brand":         <string | null>,    // brand/retailer name
  "availability":  <string | null>     // e.g. "In Stock", "Out of Stock", "Pre-order"
}

Rules:
- Strip all HTML tags from description.
- If multiple price values exist, prefer the lowest non-sale price.
- If availability is uncertain, set it to null.
- product_url must be preserved exactly as in the input.
- Truncate description to 300 characters if necessary.
"""


class LLMFormatterService:
    """
    Formats raw product dicts into validated DressProductSchema instances.
    """

    def __init__(self) -> None:
        self._client: Optional[OpenAI] = None

    def _get_client(self) -> OpenAI:
        if self._client is None:
            if not settings.XAI_API_KEY:
                raise RuntimeError(
                    "XAI_API_KEY is not configured — cannot call the LLM formatter."
                )
            self._client = OpenAI(
                api_key=settings.XAI_API_KEY,
                base_url=_XAI_BASE_URL,
            )
        return self._client

    def format_product(
        self,
        raw_data: dict[str, Any],
        source: str = "serper",
    ) -> Optional[DressProductSchema]:
        """
        Format a raw product dict into a DressProductSchema.

        The LLM is asked only when we cannot trivially extract fields from
        the input.  We always fall back to a best-effort direct mapping if
        the LLM call fails, so the pipeline never stalls on a single product.

        Parameters
        ----------
        raw_data:
            Raw product dict from Serper or ScraperAPI JSON-LD.
        source:
            Tag to mark where the data came from ("serper", "scraper", "cache").

        Returns
        -------
        DressProductSchema | None
            Formatted product, or None if we cannot extract a product_url.
        """
        # Fast path: if raw_data already has the canonical keys from our
        # Serper normaliser, construct directly without an LLM call.
        if source == "serper" and raw_data.get("productUrl"):
            return self._fast_path_serper(raw_data)

        # Slow path: call xAI to parse JSON-LD or messy Serper items
        return self._llm_format(raw_data, source)

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _fast_path_serper(item: dict[str, Any]) -> Optional[DressProductSchema]:
        """
        Directly map the normalised Serper dict to DressProductSchema
        without an LLM call.  Requires ``productUrl`` to be present.
        """
        product_url = item.get("productUrl", "")
        if not product_url:
            return None

        return DressProductSchema(
            product_name=item.get("productName", "Unknown Product"),
            price=item.get("price") or None,
            image_url=item.get("imageUrl") or None,
            product_url=product_url,
            description=item.get("description") or None,
            brand=item.get("brand") or None,
            availability=item.get("availability") or None,
            raw_metadata=item.get("_raw"),
            source="serper",
        )

    def _llm_format(
        self,
        raw_data: dict[str, Any],
        source: str,
    ) -> Optional[DressProductSchema]:
        """
        Use xAI to extract and normalise fields from an arbitrary product
        dict (typically JSON-LD from ScraperAPI).
        """
        client = self._get_client()

        # Safety: cap the size of data we send to the LLM
        raw_str = json.dumps(raw_data, ensure_ascii=False)
        if len(raw_str) > 8_000:
            raw_str = raw_str[:8_000] + "... [truncated]"

        user_message = f"Raw product data:\n{raw_str}"

        try:
            completion = client.chat.completions.create(
                model=_MODEL,
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": _SYSTEM_PROMPT},
                    {"role": "user", "content": user_message},
                ],
                temperature=0.0,
                max_tokens=400,
            )

            formatted_str: str = completion.choices[0].message.content or "{}"
            formatted_dict = json.loads(formatted_str)

            # Inject source and full raw payload before validation
            formatted_dict["source"] = source
            formatted_dict["raw_metadata"] = raw_data

            return DressProductSchema(**formatted_dict)

        except json.JSONDecodeError as exc:
            logger.warning("LLMFormatterService: JSON decode error — %s", exc)
        except ValidationError as exc:
            logger.warning("LLMFormatterService: validation error — %s", exc)
        except Exception as exc:
            logger.exception("LLMFormatterService: unexpected error — %s", exc)

        # Best-effort fallback — return None so the worker can skip this item
        return None


# Module-level singleton
llm_formatter = LLMFormatterService()
