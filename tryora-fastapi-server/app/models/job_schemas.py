from typing import Any, Literal

from pydantic import BaseModel, Field


class AvatarGenerationPayload(BaseModel):
    user_id: str
    source_image_url: str


class TryOnScenePayload(BaseModel):
    user_id: str
    avatar_glb_url: str
    dress_image_url: str


class DressSearchPayload(BaseModel):
    query: str
    max_results: int = Field(default=5, ge=1, le=20)


class JobEnqueueRequest(BaseModel):
    job_type: Literal["avatar_generation", "try_on_scene", "dress_search"]
    payload: dict[str, Any]


class JobEnqueueResponse(BaseModel):
    job_id: str
    status: str
