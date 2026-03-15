class AppError(Exception):
    """Base application exception."""


class NotFoundError(AppError):
    """Raised when a requested resource cannot be found."""


class PermissionDeniedError(AppError):
    """Raised when an action is not permitted."""