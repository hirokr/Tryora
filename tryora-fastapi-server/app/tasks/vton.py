from app.core.celery_app import celery_app
from app.models.job_schemas import TryOnScenePayload
from app.services.vton_service import VtonService


@celery_app.task(name="app.tasks.vton.try_on_scene")
def try_on_scene(payload: dict) -> dict:
    parsed = TryOnScenePayload(**payload)
    service = VtonService()
    return service.run_try_on(parsed)
