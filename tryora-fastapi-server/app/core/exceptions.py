"""Custom exception types for operational error boundaries."""


class StorageError(Exception):
    """Raised when Cloudflare R2 upload/download operations fail."""


class ModelInferenceError(Exception):
    """Raised when AI model inference fails (OOM, timeout, bad output)."""


class ExternalAPIError(Exception):
    """Raised when upstream third-party APIs fail (Serper, Anthropic)."""


class JobNotFoundError(Exception):
    """Raised when a job lookup/update fails because the DB record is missing."""
