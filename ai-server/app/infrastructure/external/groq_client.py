"""Centralized Groq client initialization for LLM services."""

from __future__ import annotations

from typing import Optional

from groq import Groq  #type: ignore[import]

from app.config.settings import settings


class GroqClientService:
    """Lazily creates and returns a singleton Groq client."""

    def __init__(self) -> None:
        self._client: Optional[Groq] = None

    def get_client(self) -> Groq:
        if self._client is None:
            if not settings.GROQ_API_KEY:
                raise RuntimeError(
                    "GROQ_API_KEY is not configured — cannot initialize Groq client."
                )
            self._client = Groq(api_key=settings.GROQ_API_KEY)

        return self._client


groq_client_service = GroqClientService()


def get_groq_client() -> Groq:
    """Convenience accessor for the shared Groq client instance."""
    return groq_client_service.get_client()