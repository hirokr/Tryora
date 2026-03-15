"""
profile.py — Pydantic models for UserProfile endpoints.
"""
from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class ProfileResponse(BaseModel):
    """Returned by GET /api/profile/me"""

    id: str
    userId: str
    measHeight: Optional[float] = Field(None, description="Height measurement (cm)")
    measChest: Optional[float] = Field(None, description="Chest measurement (cm)")
    measWaist: Optional[float] = Field(None, description="Waist measurement (cm)")
    measHips: Optional[float] = Field(None, description="Hips measurement (cm)")
    measShoulders: Optional[float] = Field(None, description="Shoulders measurement (cm)")
    tHeight: Optional[float] = Field(None, description="Normalised height [0,1]")
    tFullness: Optional[float] = Field(None, description="Normalised fullness [0,1]")
    bodyLabel: Optional[str] = Field(None, description="Body type label e.g. TALL_AVERAGE")
    # Sensitive — only populated when consent is given
    ethnicity: Optional[str] = Field(None, description="Ethnicity (requires ETHNICITY_DATA consent)")
    gender: Optional[str] = Field(None, description="Gender (requires ETHNICITY_DATA consent)")
    location: Optional[str] = Field(None, description="Location (requires ETHNICITY_DATA consent)")
    preferences: Optional[dict] = Field(None, description="Style preferences JSON")
    consentGiven: bool = Field(False, description="Whether ETHNICITY_DATA consent has been granted")
    consentAt: Optional[datetime] = None


class ProfileUpdateRequest(BaseModel):
    """Body for PUT /api/profile/me (non-sensitive fields only without consent)."""

    measHeight: Optional[float] = None
    measChest: Optional[float] = None
    measWaist: Optional[float] = None
    measHips: Optional[float] = None
    measShoulders: Optional[float] = None
    tHeight: Optional[float] = None
    tFullness: Optional[float] = None
    bodyLabel: Optional[str] = None
    # Sensitive fields — require ETHNICITY_DATA consent
    ethnicity: Optional[str] = None
    gender: Optional[str] = None
    location: Optional[str] = None
    preferences: Optional[dict] = None


class ConsentRequest(BaseModel):
    """Body for POST /api/profile/consent"""

    consentType: str = Field(
        ...,
        description="One of: ETHNICITY_DATA, IMAGE_PROCESSING, BODY_DATA",
    )
    granted: bool = Field(..., description="True to grant, False to revoke")


class ConsentResponse(BaseModel):
    consentType: str
    granted: bool
    recordedAt: str


class GdprEraseResponse(BaseModel):
    ticketId: str
    deletedAt: str
    message: str
