import asyncio
import logging

import requests

from app.core.celery_app import celery_app
from app.core.db import prisma_session
from app.core.exceptions import ExternalAPIError, JobNotFoundError
from app.models.job_schemas import DressSearchPayload
from app.services.search_service import SearchService


logger = logging.getLogger(__name__)


def _is_job_not_found_exception(exc: Exception) -> bool:
    name = exc.__class__.__name__.lower()
    message = str(exc).lower()
    return "notfound" in name or ("record" in message and "not found" in message)


def _map_search_exception(exc: Exception) -> Exception:
    if isinstance(exc, (ExternalAPIError, JobNotFoundError)):
        return exc

    if isinstance(exc, requests.RequestException):
        return ExternalAPIError(str(exc))

    if exc.__class__.__module__.startswith("anthropic"):
        return ExternalAPIError(str(exc))

    return ExternalAPIError(str(exc))


async def _set_job_status(job_id: str, status: str, error: str | None = None) -> None:
    data: dict = {"status": status}
    if error is not None:
        data["error"] = error
    try:
        async with prisma_session() as db:
            await db.aijob.update(where={"id": job_id}, data=data)
    except Exception as exc:
        if _is_job_not_found_exception(exc):
            raise JobNotFoundError(f"Job not found: {job_id}") from exc
        raise


@celery_app.task(name="app.tasks.search.dress_search_task")
def dress_search_task(job_id: str, payload: dict) -> dict:
    try:
        logger.info("Dress search task started", extra={"job_id": job_id})
        asyncio.run(_set_job_status(job_id, "PROCESSING"))
        result = dress_search(payload)
        asyncio.run(_set_job_status(job_id, "COMPLETED"))
        logger.info("Dress search task completed", extra={"job_id": job_id})
        return {"status": "COMPLETED", **result}
    except Exception as exc:
        mapped_exc = _map_search_exception(exc)
        logger.exception(
            "Dress search task failed",
            extra={"job_id": job_id},
            exc_info=exc,
        )
        try:
            asyncio.run(_set_job_status(job_id, "FAILED", str(mapped_exc)))
        except JobNotFoundError:
            logger.exception(
                "Failed to update dress search job status because job was not found",
                extra={"job_id": job_id},
            )
        raise mapped_exc from exc


@celery_app.task(name="app.tasks.search.dress_search")
def dress_search(payload: dict) -> dict:
    parsed = DressSearchPayload(**payload)
    job_id = payload.get("job_id", "n/a")
    logger.info("Running dress search", extra={"job_id": job_id})
    service = SearchService()
    dresses = service.search(parsed.query, parsed.max_results)
    return {
        "query": parsed.query,
        "count": len(dresses),
        "items": [item.model_dump() for item in dresses],
    }
