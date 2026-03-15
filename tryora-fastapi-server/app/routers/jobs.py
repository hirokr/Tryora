from typing import Any
from uuid import uuid4

from fastapi import APIRouter, HTTPException, Request

from app.core.db import prisma_session
from app.core.rate_limit import limiter
from app.models.job_schemas import JobRequest, JobResponse, JobStatusResponse
from app.tasks.avatar import avatar_generation_task
from app.tasks.search import dress_search_task
from app.tasks.vton import vton_task


router = APIRouter(prefix="/jobs", tags=["jobs"])

JOB_TASK_MAP: dict[str, Any] = {
    "AVATAR_GENERATION": avatar_generation_task,
    "TRY_ON_SCENE": vton_task,
    "DRESS_SEARCH": dress_search_task,
}


def _read_field(obj: Any, *keys: str) -> Any:
    if isinstance(obj, dict):
        for key in keys:
            if key in obj:
                return obj[key]
        return None
    for key in keys:
        if hasattr(obj, key):
            return getattr(obj, key)
    return None


@router.post("", response_model=JobResponse)
@limiter.limit("10/minute")
async def enqueue_job(request: Request, job: JobRequest) -> JobResponse:
    _ = request
    task = JOB_TASK_MAP.get(job.jobType)
    if not task:
        raise HTTPException(status_code=400, detail="Unknown jobType")

    job_id = str(uuid4())

    async with prisma_session() as db:
        await db.aijob.create(
            data={
                "id": job_id,
                "job_type": job.jobType,
                "status": "PENDING",
                "payload": job.payload,
            }
        )

    task.delay(job_id, job.payload)
    return JobResponse(jobId=job_id, status="PENDING")


@router.get("/{job_id}", response_model=JobStatusResponse)
async def get_job_status(job_id: str) -> JobStatusResponse:
    async with prisma_session() as db:
        job = await db.aijob.find_unique(where={"id": job_id})

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    return JobStatusResponse(
        jobId=str(_read_field(job, "id")),
        status=str(_read_field(job, "status")),
        resultUrl=_read_field(job, "resultUrl", "result_url"),
        error=_read_field(job, "error"),
    )
