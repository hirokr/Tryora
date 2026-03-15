"""
request_id.py — X-Request-ID header injection middleware
---------------------------------------------------------
Ensures every request and response carries a unique `X-Request-ID` header.
If the client already sent one, it is preserved; otherwise a new UUID is generated.
"""
from __future__ import annotations

import uuid
from typing import Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware


class RequestIDMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        # Store on request state so route handlers can log it
        request.state.request_id = request_id

        response: Response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response
