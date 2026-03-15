"""
search_service.py
-----------------
Stateless helpers used by the DRESS_SEARCH Celery pipeline.

extract_search_params  — LLM-based natural-language → structured JSON
search_dresses         — Serper Shopping API → normalised product list
"""

from __future__ import annotations

import json
import logging
from typing import Any

import anthropic
import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

_ANTHROPIC_SYSTEM_PROMPT = (
    "You are a fashion search parameter extractor. "
    "Given a user's natural language description, return ONLY a valid JSON object "
    "with keys: style (str), colors (list[str]), event_type (str), garment_type (str). "
    "No explanation. No markdown. JSON only."
)

_SERPER_SHOPPING_URL = "https://google.serper.dev/shopping"
_REQUEST_TIMEOUT_S: float = 15.0


# ---------------------------------------------------------------------------
# Public functions
# ---------------------------------------------------------------------------


def extract_search_params(prompt: str) -> dict:
    """
    Call Anthropic claude-sonnet-4-6 to convert a free-text fashion prompt
    into a structured parameter dict.

    Returns
    -------
    dict with keys: style, colors, event_type, garment_type

    Raises
    ------
    ValueError  if the model returns text that cannot be parsed as JSON.
    """
    client = anthropic.Anthropic()
    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system=_ANTHROPIC_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompt}],
    )
    text: str = message.content[0].text
    try:
        return json.loads(text)
    except json.JSONDecodeError as exc:
        raise ValueError(
            f"LLM returned non-JSON response. "
            f"Expected a JSON object, got: {text!r}"
        ) from exc


def search_dresses(params: dict) -> list[dict[str, Any]]:
    """
    Execute a Serper Google Shopping search restricted to Myntra and Ajio.

    Parameters
    ----------
    params:
        Structured dict produced by :func:`extract_search_params`.
        Expected keys: style, colors (list), garment_type.

    Returns
    -------
    list of dicts, each with keys: title, price, imageUrl, storeUrl, brand.
    Always returns an empty list on any API or network error — never raises.
    """
    style: str = params.get("style") or ""
    garment_type: str = params.get("garment_type") or "dress"
    colors: list = params.get("colors") or []
    first_color: str = colors[0] if colors else ""

    query = (
        f"{style} {garment_type} {first_color} dress"
        " site:myntra.com OR site:ajio.com"
    ).strip()

    try:
        with httpx.Client(timeout=_REQUEST_TIMEOUT_S) as client:
            response = client.post(
                _SERPER_SHOPPING_URL,
                headers={
                    "X-API-KEY": settings.SERPER_APIKEY,
                    "Content-Type": "application/json",
                },
                json={"q": query, "gl": "in", "num": 10},
            )
            response.raise_for_status()
            data: dict = response.json()
    except Exception as exc:
        logger.error("search_dresses: Serper API error — %s", exc)
        return []

    results: list[dict[str, Any]] = []
    for item in data.get("shopping", []):
        results.append(
            {
                "title": item.get("title", ""),
                "price": item.get("price", ""),
                "imageUrl": item.get("imageUrl") or item.get("thumbnailUrl", ""),
                "storeUrl": item.get("link", ""),
                "brand": item.get("source", ""),
            }
        )
    return results
