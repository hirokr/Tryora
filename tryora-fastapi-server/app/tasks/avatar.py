from app.core.celery_app import celery_app
from app.models.job_schemas import AvatarGenerationPayload
from app.services.avatar_service import AvatarService


@celery_app.task(name="app.tasks.avatar.avatar_generation")
def avatar_generation(payload: dict) -> dict:
    parsed = AvatarGenerationPayload(**payload)
    service = AvatarService()
    return service.generate_avatar(parsed)
