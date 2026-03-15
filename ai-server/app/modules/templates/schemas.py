"""
template.py — Pydantic models for DressTemplate endpoints.
"""
from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class DressTemplateResponse(BaseModel):
    """Single template in list / detail responses."""

    id: str
    name: str
    category: str
    ethnicity: Optional[str] = None
    bodyLabel: Optional[str] = None
    thumbnailUrl: Optional[str] = None
    isActive: bool
    createdAt: datetime


class DressTemplateListResponse(BaseModel):
    items: list[DressTemplateResponse]
    total: int
    page: int
    pageSize: int


class UploadDressImageResponse(BaseModel):
    """Response for POST /api/3d/upload/dress-image"""

    s3Key: str = Field(..., description="S3 key of the uploaded (EXIF-stripped) image")
    sha256: str = Field(..., description="SHA-256 hex digest of the stripped image content")
    sizeBytes: int
    contentType: str
