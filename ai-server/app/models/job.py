"""
job.py — Pydantic models for GenerationJob state.
"""
from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class JobProgress(BaseModel):
    jobId: str
    status: str  # PENDING | PROCESSING | COMPLETED | FAILED
    progress: int  # 0-100
    currentStage: Optional[str] = None
    errorMessage: Optional[str] = None
    usedFallback: bool = False


class JobResultResponse(BaseModel):
    """Returned when job is COMPLETED — provides presigned GLB URL."""

    jobId: str
    status: str
    outputUrl: Optional[str] = None  # presigned S3 URL (15-min TTL)
    usedFallback: bool = False
    completedAt: Optional[datetime] = None
