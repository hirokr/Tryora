from app.models.job_schemas import TryOnScenePayload


class VtonService:
    """Entry point for OOTDiffusion try-on inference."""

    def run_try_on(self, payload: TryOnScenePayload) -> dict:
        return {
            "status": "accepted",
            "user_id": payload.user_id,
            "avatar_glb_url": payload.avatar_glb_url,
            "dress_image_url": payload.dress_image_url,
            "output_image_url": None,
            "message": "Try-on pipeline placeholder",
        }
