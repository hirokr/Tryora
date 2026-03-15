from app.models.job_schemas import AvatarGenerationPayload


class AvatarService:
    """Entry point for avatar generation pipeline.

    This is intentionally a lightweight placeholder where HMR2.0, SMPL-X,
    and GLB export integration can be wired in.
    """

    def generate_avatar(self, payload: AvatarGenerationPayload) -> dict:
        return {
            "status": "accepted",
            "user_id": payload.user_id,
            "source_image_url": payload.source_image_url,
            "result_glb_url": None,
            "message": "Avatar generation pipeline placeholder",
        }
