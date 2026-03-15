from app.shared.security.jwt import get_current_admin as require_admin

__all__ = ["require_admin"]