"""Live external API smoke tests.

These tests are opt-in and intentionally call real providers.
Enable with:

    RUN_LIVE_EXTERNAL_API_TESTS=1 pytest -q tests/integration/external/test_external_apis_live.py

Optional Tripo call (can consume credits):

    RUN_TRIPO_LIVE=1 TRIPO_LIVE_IMAGE_URL=https://... pytest -q tests/integration/external/test_external_apis_live.py -k tripo
"""

from __future__ import annotations

import os

import pytest

from app.infrastructure.external.serper_client import SerperShoppingService
from app.infrastructure.external.tripo_client import TripoClient

pytestmark = [pytest.mark.integration, pytest.mark.external]


def _require_live_mode() -> None:
    if os.getenv("RUN_LIVE_EXTERNAL_API_TESTS", "0") != "1":
        pytest.skip("Live API tests are disabled. Set RUN_LIVE_EXTERNAL_API_TESTS=1 to run them.")


@pytest.mark.asyncio
async def test_serper_live_shopping_search_returns_structured_items():
    _require_live_mode()

    service = SerperShoppingService()
    if not service._api_key:
        pytest.skip("SERPER_APIKEY is missing.")

    results = await service.search("women formal midi dress", num_results=5, country="us")

    assert isinstance(results, list)
    assert len(results) > 0, "Serper returned no results; check API key/quota/network."

    first = results[0]
    assert "productName" in first
    assert "productUrl" in first
    assert first["productName"]
    assert first["productUrl"].startswith("http")


def test_groq_live_prompt_parser_returns_valid_schema():
    _require_live_mode()

    try:
        from app.modules.dress_search.parser import LLMParserService
    except ModuleNotFoundError as exc:
        pytest.skip(f"Groq parser dependency is unavailable in this environment: {exc}")

    parser = LLMParserService()
    try:
        parsed = parser.parse_prompt(
            prompt="I need a flowy maxi dress for a summer wedding under 250 dollars",
            geo="San Diego, CA",
        )
    except RuntimeError as exc:
        if "GROQ_API_KEY" in str(exc):
            pytest.skip("GROQ_API_KEY is missing.")
        raise

    assert parsed is not None
    # At least one extracted field should be present for this prompt.
    assert any(
        value is not None
        for value in [
            parsed.event,
            parsed.garment_length,
            parsed.season,
            parsed.budget_range,
            parsed.style_keywords,
        ]
    )


@pytest.mark.asyncio
async def test_tripo_live_submission_and_poll_smoke():
    _require_live_mode()

    if os.getenv("RUN_TRIPO_LIVE", "0") != "1":
        pytest.skip("Tripo live test disabled. Set RUN_TRIPO_LIVE=1 to enable.")

    image_url = os.getenv("TRIPO_LIVE_IMAGE_URL")
    if not image_url:
        pytest.skip("TRIPO_LIVE_IMAGE_URL is required for Tripo live test.")

    client = TripoClient()

    task_id = await client.image_to_3d(image_url)
    assert isinstance(task_id, str)
    assert task_id

    result = await client.poll_until_done(task_id=task_id, max_wait=180, interval=5)
    assert isinstance(result, dict)
    assert result.get("status") == "success"
