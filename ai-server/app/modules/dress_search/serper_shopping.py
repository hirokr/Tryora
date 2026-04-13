"""Compatibility wrapper for the shared Serper client.

The runtime implementation lives in app.infrastructure.external.serper_client.
This module is kept so older imports continue to work.
"""

from app.infrastructure.external.serper_client import (
    SerperShoppingService,
    serper_shopping,
)

__all__ = ["SerperShoppingService", "serper_shopping"]
