from fastapi import APIRouter, Depends

from app.api.admin import router as admin_router
from app.api.health import router as health_router
from app.modules.avatar.api import router as avatar_router
from app.modules.dress_search.api import router as dress_search_router
from app.modules.profiles.api import router as profile_router
from app.modules.templates.api import router as templates_router
from app.modules.try_on.api import router as try_on_router
from app.modules.uploads.api import router as uploads_router
from app.shared.security.api_key import checkApiKey

router = APIRouter()

router.include_router(health_router, prefix="/api/v1")
router.include_router(profile_router, prefix="/api")
router.include_router(templates_router, prefix="/api")
router.include_router(try_on_router, prefix="/api")
router.include_router(avatar_router, prefix="/api")
router.include_router(uploads_router, prefix="/api")
router.include_router(admin_router, prefix="/api")

internal_router = APIRouter(prefix="/internal/ai", dependencies=[Depends(checkApiKey)])
internal_router.include_router(dress_search_router)
router.include_router(internal_router)