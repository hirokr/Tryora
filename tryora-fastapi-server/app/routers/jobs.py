from typing import Any

from fastapi import APIRouter, HTTPException

from app.models.job_schemas import JobEnqueueRequest, JobEnqueueResponse


router = APIRouter(prefix="/jobs", tags=["jobs"])

JOB_TASK_MAP: dict[str, str] = {
    "avatar_generation": "app.tasks.avatar.avatar_generation",
    "try_on_scene": "app.tasks.vton.try_on_scene",
    "dress_search": "app.tasks.search.dress_search",
}


@router.post("", response_model=JobEnqueueResponse)
def enqueue_job(job: JobEnqueueRequest) -> JobEnqueueResponse:
    task_name = JOB_TASK_MAP.get(job.job_type)
    if not task_name:
        raise HTTPException(status_code=400, detail="Unsupported job type")

    from app.core.celery_app import celery_app

    async_result = celery_app.send_task(task_name, kwargs={"payload": job.payload})
    return JobEnqueueResponse(job_id=async_result.id, status="queued")
