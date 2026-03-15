"""
tests/test_search_service.py
----------------------------
Unit tests for app/services/search_service.py.

All external I/O (Anthropic API, httpx/Serper) is mocked so no real network
calls are made and no API keys are required at test-time.

Tests
~~~~~
1. test_extract_search_params_returns_valid_json
   Mock Anthropic client returns valid JSON; assert dict with all four keys.

2. test_extract_search_params_raises_on_bad_json
   Mock Anthropic client returns non-JSON text; assert ValueError is raised.

3. test_search_dresses_handles_api_error
   Mock httpx.Client.post raises; assert empty list is returned (never raises).
"""

from __future__ import annotations

import json
from unittest.mock import MagicMock, patch

import httpx
import pytest

from app.services.search_service import extract_search_params, search_dresses

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_VALID_PARAMS = {
    "style": "boho",
    "colors": ["ivory", "dusty rose"],
    "event_type": "beach wedding",
    "garment_type": "maxi dress",
}

_REQUIRED_KEYS = {"style", "colors", "event_type", "garment_type"}


def _make_anthropic_mock(text: str) -> MagicMock:
    """Return a mock that can replace ``anthropic.Anthropic()``."""
    mock_content = MagicMock()
    mock_content.text = text

    mock_message = MagicMock()
    mock_message.content = [mock_content]

    mock_client = MagicMock()
    mock_client.messages.create.return_value = mock_message

    return mock_client


# ---------------------------------------------------------------------------
# Tests: extract_search_params
# ---------------------------------------------------------------------------


class TestExtractSearchParams:

    def test_extract_search_params_returns_valid_json(self):
        """
        When the LLM returns a valid JSON string the function should parse
        it and return a dict that contains all four required keys.
        """
        mock_client = _make_anthropic_mock(json.dumps(_VALID_PARAMS))

        with patch(
            "app.services.search_service.anthropic.Anthropic",
            return_value=mock_client,
        ):
            result = extract_search_params(
                "I need a boho ivory maxi dress for a beach wedding"
            )

        assert isinstance(result, dict)
        assert _REQUIRED_KEYS.issubset(result.keys()), (
            f"Missing keys: {_REQUIRED_KEYS - result.keys()}"
        )
        assert result["style"] == "boho"
        assert "ivory" in result["colors"]

    def test_extract_search_params_raises_on_bad_json(self):
        """
        When the LLM returns non-JSON text, the function must raise
        ValueError with a descriptive message.
        """
        mock_client = _make_anthropic_mock("Sorry, I cannot help with that.")

        with patch(
            "app.services.search_service.anthropic.Anthropic",
            return_value=mock_client,
        ):
            with pytest.raises(ValueError, match="non-JSON"):
                extract_search_params("some fashion prompt")


# ---------------------------------------------------------------------------
# Tests: search_dresses
# ---------------------------------------------------------------------------


class TestSearchDresses:

    def test_search_dresses_handles_api_error(self):
        """
        When httpx raises any exception during the POST request,
        search_dresses must catch it and return an empty list — never re-raise.
        """
        mock_client_instance = MagicMock()
        mock_client_instance.post.side_effect = httpx.ConnectError(
            "Connection refused"
        )

        # Patch httpx.Client so the context-manager yields our mock
        mock_cm = MagicMock()
        mock_cm.__enter__ = MagicMock(return_value=mock_client_instance)
        mock_cm.__exit__ = MagicMock(return_value=False)

        with patch(
            "app.services.search_service.httpx.Client",
            return_value=mock_cm,
        ):
            result = search_dresses(
                {"style": "boho", "garment_type": "dress", "colors": ["ivory"]}
            )

        assert result == []
