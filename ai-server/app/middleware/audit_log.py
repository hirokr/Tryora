import time
from starlette.middleware.base import BaseHTTPMiddleware
from ..core.logger import logger

class AuditLogMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        start_time = time.perf_counter()
        response = await call_next(request)
        process_time = time.perf_counter() - start_time
        
        logger.info(f"{request.method} {request.url.path} - {response.status_code} ({process_time:.4f}s)")
        return response
