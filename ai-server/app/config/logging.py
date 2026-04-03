import logging
import os
import sys
from logging.handlers import RotatingFileHandler

from app.config.settings import settings

log_dir = "logs"
if not os.path.exists(log_dir):
    os.makedirs(log_dir)

logger = logging.getLogger("api_security")
logger.setLevel(getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO))

log_format = logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")

stream_handler = logging.StreamHandler(sys.stdout)
stream_handler.setFormatter(log_format)

file_handler = RotatingFileHandler(
    os.path.join(log_dir, "api.log"), maxBytes=10 * 1024 * 1024, backupCount=5
)
file_handler.setFormatter(log_format)

if not logger.handlers:
    logger.addHandler(stream_handler)
    logger.addHandler(file_handler)

logger.propagate = False


def configure_logging() -> logging.Logger:
    logger.setLevel(getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO))
    return logger
