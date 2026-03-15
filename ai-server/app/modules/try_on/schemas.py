"""
try_on.py — Pydantic models for try-on and job endpoints.
"""
from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field, model_validator


class TryOnRequest(BaseModel):
    """Body for POST /api/3d/try-on"""

    avatarId: str = Field(..., description="ID of the user's avatar (UserBodyImage)")
    templateDressId: Optional[str] = Field(None, description="DressTemplate ID (fast path)")
    userImageS3Key: Optional[str] = Field(None, description="S3 key of uploaded dress image")
    scenePrompt: Optional[str] = Field(None, description="Optional text prompt for scene context")

    @model_validator(mode="after")
    def require_at_least_one_dress_source(self) -> "TryOnRequest":
        if not self.templateDressId and not self.userImageS3Key:
            raise ValueError(
                "At least one of templateDressId or userImageS3Key must be provided"
            )
        return self


class TryOnJobResponse(BaseModel):
    """Response for POST /api/3d/try-on"""

    jobId: str
    status: str = "PENDING"


class JobStatusResponse(BaseModel):
    """Response for GET /api/3d/jobs/{jobId}"""

    jobId: str
    status: str
    progress: int
    currentStage: Optional[str] = None
    errorMessage: Optional[str] = None
