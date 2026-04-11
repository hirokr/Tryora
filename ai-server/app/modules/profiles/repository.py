"""Repository and gateway protocols for profiles."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Any, Optional, Protocol


@dataclass
class ConsentDecision:
    consent_type: str
    granted: bool
    recorded_at: datetime


class ProfileRepository(Protocol):
    async def get_active_profile(self, user_id: str) -> Optional[Any]:
        """Return a profile when it exists and is not soft-deleted."""
        ...

    async def upsert_profile(self, user_id: str, data: dict[str, Any]) -> Any:
        """Create or update the user's profile and return the record."""
        ...


class ConsentRepository(Protocol):
    async def has_granted_consent(self, user_id: str, consent_type: str) -> bool:
        """Return True when the user granted the given consent type."""
        ...


class ConsentGateway(Protocol):
    async def record_consent(
        self,
        *,
        user_id: str,
        consent_type: str,
        granted: bool,
        ip_address: str,
        user_agent: str,
    ) -> ConsentDecision:
        """Record a consent decision through an external gateway."""
        ...


class EraseGateway(Protocol):
    async def erase_user(self, *, user_id: str) -> str:
        """Execute GDPR erase flow and return a support ticket id."""
        ...