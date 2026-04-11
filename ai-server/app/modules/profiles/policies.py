"""Authorization policies for profile access and updates."""

from __future__ import annotations

from fastapi import HTTPException, status

from .constants import DEFAULT_CONSENT_TYPE

class ProfilePolicy:
    """Policy checks related to consent-gated sensitive profile writes."""

    @staticmethod
    def ensure_sensitive_write_allowed(
        *,
        requested_sensitive_fields: set[str],
        has_required_consent: bool,
        consent_type: str = DEFAULT_CONSENT_TYPE,
    ) -> None:
        if not requested_sensitive_fields:
            return
        if has_required_consent:
            return

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                f"{consent_type} consent is required before writing sensitive fields. "
                "Call POST /api/profile/consent first."
            ),
        )