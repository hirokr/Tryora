"""Domain models for profiles with consent-aware projection rules."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Any, Optional

from .constants import SENSITIVE_FIELDS


@dataclass(frozen=True)
class UserProfile:
    id: str
    user_id: str
    meas_height: Optional[float] = None
    meas_chest: Optional[float] = None
    meas_waist: Optional[float] = None
    meas_hips: Optional[float] = None
    meas_shoulders: Optional[float] = None
    t_height: Optional[float] = None
    t_fullness: Optional[float] = None
    body_label: Optional[str] = None
    ethnicity: Optional[str] = None
    gender: Optional[str] = None
    location: Optional[str] = None
    preferences: Optional[dict[str, Any]] = None
    consent_given: bool = False
    consent_at: Optional[datetime] = None

    @classmethod
    def from_record(cls, record: Any) -> "UserProfile":
        """Map a repository record (Prisma-like object) into the domain model."""
        return cls(
            id=record.id,
            user_id=record.userId,
            meas_height=record.measHeight,
            meas_chest=record.measChest,
            meas_waist=record.measWaist,
            meas_hips=record.measHips,
            meas_shoulders=record.measShoulders,
            t_height=record.tHeight,
            t_fullness=record.tFullness,
            body_label=record.bodyLabel,
            ethnicity=record.ethnicity,
            gender=record.gender,
            location=record.location,
            preferences=record.preferences,
            consent_given=bool(record.consentGiven),
            consent_at=record.consentAt,
        )

    def masked(self) -> "UserProfile":
        """Return a profile with sensitive fields removed when consent is missing."""
        if self.consent_given:
            return self

        return UserProfile(
            id=self.id,
            user_id=self.user_id,
            meas_height=self.meas_height,
            meas_chest=self.meas_chest,
            meas_waist=self.meas_waist,
            meas_hips=self.meas_hips,
            meas_shoulders=self.meas_shoulders,
            t_height=self.t_height,
            t_fullness=self.t_fullness,
            body_label=self.body_label,
            ethnicity=None,
            gender=None,
            location=None,
            preferences=None,
            consent_given=self.consent_given,
            consent_at=self.consent_at,
        )


def split_sensitive_updates(update_data: dict[str, Any]) -> tuple[dict[str, Any], set[str]]:
    """Return incoming updates and the sensitive fields requested in that payload."""
    requested_sensitive = set(update_data).intersection(SENSITIVE_FIELDS)
    return update_data, requested_sensitive