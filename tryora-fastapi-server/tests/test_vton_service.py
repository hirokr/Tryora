from app.models.job_schemas import TryOnScenePayload
from app.services.vton_service import VtonService


def test_run_try_on_returns_placeholder_response() -> None:
    payload = TryOnScenePayload(
        user_id="u-1",
        avatar_glb_url="https://example.com/avatar.glb",
        dress_image_url="https://example.com/dress.jpg",
    )
    service = VtonService()

    result = service.run_try_on(payload)
    assert result["status"] == "accepted"
    assert result["output_image_url"] is None
