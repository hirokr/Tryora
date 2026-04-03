"""
parser.py
---------
Translates a free-text user prompt into a strict DressSearchParams object
by calling the xAI (Grok) model with a system prompt that instructs it to
return *only* valid JSON conforming to the DressSearchParams schema.

We use the OpenAI-compatible xAI REST API so we can leverage
``response_format={"type": "json_object"}`` for deterministic JSON output —
no regex post-processing required.

The call is deliberately synchronous-friendly (wrapped in asyncio.to_thread
by the worker) but can also be awaited directly in an async context via
the provided async wrapper.
"""

from __future__ import annotations

import json
import logging
from typing import Optional

from openai import OpenAI  # xAI exposes an OpenAI-compatible endpoint
from pydantic import ValidationError

from app.config.settings import settings
from app.schemas.dress_search import DressSearchParams

logger = logging.getLogger("api_security")

# ------------------------------------------------------------------
# xAI client — OpenAI-compatible base URL
# ------------------------------------------------------------------

_XAI_BASE_URL = "https://api.x.ai/v1"
_MODEL = "grok-3-mini"   # fast, cheap reasoning model; swap to grok-3 for richer output

# System prompt drives the LLM's behaviour.  It is injected once per call
# (not stored on the client) so we can version-control it here easily.
_SYSTEM_PROMPT = """\
You are a fashion-understanding assistant for the Tryora platform.

Your ONLY task is to parse the user's dress-preference prompt and return a
single JSON object that strictly matches the following schema.  Do NOT add
extra keys.  Do NOT include markdown, explanations, or any text outside the
JSON object.

Schema:
{
  "event":           <string | null>,   // occasion (e.g. "beach wedding")
  "style_keywords":  <list[str] | null>,// e.g. ["boho", "flowy"]
  "colors":          <list[str] | null>,// e.g. ["dusty rose", "ivory"]
  "geo":             <string | null>,   // geographic context if mentioned
  "garment_length":  <string | null>,   // "maxi" | "midi" | "mini" | "knee-length" | ...
  "fabric":          <string | null>,   // e.g. "chiffon", "linen", "satin"
  "neckline":        <string | null>,   // e.g. "V-neck", "off-shoulder"
  "season":          <string | null>,   // "spring" | "summer" | "autumn" | "winter" | "all-season"
  "budget_range":    {                  // null if no budget is mentioned
    "min":      <float | null>,
    "max":      <float | null>,
    "currency": <string>                // ISO 4217, default "USD"
  } | null
}

Rules:
- Leave a field null if it cannot be confidently inferred; do NOT guess.
- "geo" should only be populated if the user explicitly mentions a location
  DIFFERENT from what is already provided as the system geo parameter.
- Normalise garment_length to one of: "maxi", "midi", "mini", "knee-length",
  "above-knee", "floor-length".
- Normalise season to one of: "spring", "summer", "autumn", "winter", "all-season".
"""


class LLMParserService:
    """
    Parses a raw user prompt into a validated DressSearchParams instance.

    The xAI client is constructed lazily on first use so the module can be
    imported even when XAI_API_KEY is not set (e.g. in unit tests that mock
    this class).
    """

    def __init__(self) -> None:
        self._client: Optional[OpenAI] = None

    def _get_client(self) -> OpenAI:
        if self._client is None:
            if not settings.XAI_API_KEY:
                raise RuntimeError(
                    "XAI_API_KEY is not configured — cannot call the LLM parser."
                )
            self._client = OpenAI(
                api_key=settings.XAI_API_KEY,
                base_url=_XAI_BASE_URL,
            )
        return self._client

    def parse_prompt(self, prompt: str, geo: str) -> DressSearchParams:
        """
        Synchronously call xAI and parse the JSON response into
        DressSearchParams.

        This method blocks until the LLM responds and is safe to run in a
        Celery task (which manages its own event loop).

        Parameters
        ----------
        prompt:
            The raw user input (e.g. "I need a flowy maxi for a beach
            wedding this summer").
        geo:
            The geographic context provided by the client; injected into the
            user message so the LLM can reference it.

        Returns
        -------
        DressSearchParams
            Validated structured parameters.

        Raises
        ------
        RuntimeError
            If the LLM returns malformed JSON or Pydantic validation fails
            after two retry attempts.
        """
        client = self._get_client()

        user_message = (
            f"User GEO context: {geo}\n\n"
            f"User prompt: {prompt}"
        )

        last_error: Optional[Exception] = None

        # Allow one retry in case the model returns slightly malformed JSON
        for attempt in range(2):
            try:
                completion = client.chat.completions.create(
                    model=_MODEL,
                    response_format={"type": "json_object"},
                    messages=[
                        {"role": "system", "content": _SYSTEM_PROMPT},
                        {"role": "user", "content": user_message},
                    ],
                    temperature=0.0,   # deterministic output
                    max_tokens=512,
                )

                raw_json: str = completion.choices[0].message.content or "{}"
                parsed_dict = json.loads(raw_json)
                return DressSearchParams(**parsed_dict)

            except json.JSONDecodeError as exc:
                logger.warning(
                    "LLMParserService: attempt %d — JSON decode error: %s",
                    attempt + 1,
                    exc,
                )
                last_error = exc

            except ValidationError as exc:
                logger.warning(
                    "LLMParserService: attempt %d — Pydantic validation error: %s",
                    attempt + 1,
                    exc,
                )
                last_error = exc

            except Exception as exc:
                logger.exception(
                    "LLMParserService: attempt %d — unexpected error: %s",
                    attempt + 1,
                    exc,
                )
                last_error = exc
                break  # Non-recoverable (auth, network, etc.) — don't retry

        raise RuntimeError(
            f"LLMParserService failed to parse prompt after 2 attempts: {last_error}"
        )


# Module-level singleton
llm_parser = LLMParserService()
