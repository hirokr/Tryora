"""
schemas.py — Pydantic models for the avatar generation endpoints.

Flow:
  1. User uploads 1–3 photos via POST /api/3d/upload/dress-image → gets S3 keys
  2. User calls POST /api/3d/avatar/generate with those S3 keys
  3. Poll GET /api/3d/avatar/jobs/{jobId} for progress
  4. GET /api/3d/avatar/jobs/{jobId}/result → 302 redirect to presigned GLB URL
"""
from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field, model_validator


class AvatarGenerateRequest(BaseModel):
    """Body for POST /api/3d/avatar/generate"""

    frontPhotoS3Key: str = Field(
        ...,
        description="S3 key of the front-facing full-body photo (required).",
    )
    sidePhotoS3Key: Optional[str] = Field(
        default=None,
        description="S3 key of the side-profile photo (optional — improves depth accuracy).",
    )
    backPhotoS3Key: Optional[str] = Field(
        default=None,
        description="S3 key of the back-facing photo (optional — improves rear detail).",
    )
    heightCm: Optional[float] = Field(
        default=None,
        ge=100.0,
        le=250.0,
        description=(
            "User's height in centimetres. Used to correctly scale the SMPL-X "
            "fallback mesh and is stored in UserProfile.measHeight."
        ),
    )

    @model_validator(mode="after")
    def front_photo_must_exist(self) -> "AvatarGenerateRequest":
        if not self.frontPhotoS3Key.strip():
            raise ValueError("frontPhotoS3Key cannot be empty")
        return self


class AvatarGenerateResponse(BaseModel):
    """Immediate 202 response after job is queued."""

    jobId: str
    status: str = "PENDING"
    message: str = Field(
        default="Avatar generation has been queued. Poll /api/3d/avatar/jobs/{jobId} for progress."
    )


class AvatarJobStatusResponse(BaseModel):
    """Response for GET /api/3d/avatar/jobs/{jobId}"""

    jobId: str
    status: str                          # PENDING | PROCESSING | COMPLETED | FAILED
    progress: int = Field(ge=0, le=100)
    currentStage: Optional[str] = None
    provider: Optional[str] = None       # which tier produced the GLB
    errorMessage: Optional[str] = None
    createdAt: str
    completedAt: Optional[str] = None
