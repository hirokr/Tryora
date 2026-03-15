"""Structured JSON logging configuration for app.* loggers."""

from __future__ import annotations

import json
import logging
import os
from contextvars import ContextVar
from datetime import datetime, timezone
from typing import Any

_REQUEST_ID_CTX: ContextVar[str | None] = ContextVar("request_id", default=None)


class _ContextFilter(logging.Filter):
    """Injects service and context fields into all log records."""

    def filter(self, record: logging.LogRecord) -> bool:
        if not hasattr(record, "service"):
            record.service = "tryora-fastapi"
        if not hasattr(record, "job_id"):
            record.job_id = None
        if not hasattr(record, "request_id"):
            record.request_id = _REQUEST_ID_CTX.get()
        return True


class _JSONFormatter(logging.Formatter):
    """Formats logs as JSON with stable top-level fields."""

    def format(self, record: logging.LogRecord) -> str:
        payload: dict[str, Any] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "service": getattr(record, "service", "tryora-fastapi"),
            "job_id": getattr(record, "job_id", None),
            "message": record.getMessage(),
            "request_id": getattr(record, "request_id", None),
        }
        if record.exc_info:
            payload["exc_info"] = self.formatException(record.exc_info)
        return json.dumps(payload, ensure_ascii=True)


def set_request_id(request_id: str) -> None:
    """Attach request ID to the current context for logging."""
    _REQUEST_ID_CTX.set(request_id)


def clear_request_id() -> None:
    """Clear request ID from the current context."""
    _REQUEST_ID_CTX.set(None)


def configure_logging() -> None:
    """Configure a single JSON stream handler for all app.* loggers."""
    raw_level = os.getenv("LOG_LEVEL", "INFO").upper()
    level = getattr(logging, raw_level, logging.INFO)

    handler = logging.StreamHandler()
    handler.setLevel(level)
    handler.setFormatter(_JSONFormatter())
    handler.addFilter(_ContextFilter())

    app_logger = logging.getLogger("app")
    app_logger.handlers.clear()
    app_logger.addHandler(handler)
    app_logger.setLevel(level)
    app_logger.propagate = False

    for name, logger_obj in logging.root.manager.loggerDict.items():
        if not name.startswith("app."):
            continue
        if isinstance(logger_obj, logging.Logger):
            logger_obj.handlers.clear()
            logger_obj.setLevel(level)
            logger_obj.propagate = True
