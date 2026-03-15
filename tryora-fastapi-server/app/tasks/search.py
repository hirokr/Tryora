from app.core.celery_app import celery_app
from app.models.job_schemas import DressSearchPayload
from app.services.search_service import SearchService


@celery_app.task(name="app.tasks.search.dress_search")
def dress_search(payload: dict) -> dict:
    parsed = DressSearchPayload(**payload)
    service = SearchService()
    dresses = service.search(parsed.query, parsed.max_results)
    return {
        "query": parsed.query,
        "count": len(dresses),
        "items": [item.model_dump() for item in dresses],
    }
