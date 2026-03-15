from app.infrastructure.cache.cache_service import CacheService


def base_avatar_key(user_id: str) -> str:
    return CacheService.key_base_avatar(user_id)


def template_result_key(template_id: str, body_label: str) -> str:
    return CacheService.key_template_dress(template_id, body_label)