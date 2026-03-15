import logging
from uuid import uuid4

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded

from app.core.exceptions import ExternalAPIError, ModelInferenceError, StorageError
from app.core.logging import clear_request_id, configure_logging, set_request_id
from app.core.rate_limit import limiter
from app.routers import health, jobs


configure_logging()
logger = logging.getLogger(__name__)

app = FastAPI(title="Tryora FastAPI Server", version="0.1.0")
app.state.limiter = limiter


@app.middleware("http")
async def request_id_middleware(request: Request, call_next):
	request_id = str(uuid4())
	set_request_id(request_id)
	try:
		response = await call_next(request)
	finally:
		clear_request_id()

	response.headers["X-Request-ID"] = request_id
	return response


@app.exception_handler(StorageError)
async def storage_error_handler(_: Request, exc: StorageError) -> JSONResponse:
	return JSONResponse(
		status_code=503,
		content={"error": "Storage unavailable", "detail": str(exc)},
	)


@app.exception_handler(ModelInferenceError)
async def model_inference_error_handler(
	_: Request, exc: ModelInferenceError
) -> JSONResponse:
	return JSONResponse(
		status_code=503,
		content={"error": "Model inference failed", "detail": str(exc)},
	)


@app.exception_handler(ExternalAPIError)
async def external_api_error_handler(_: Request, exc: ExternalAPIError) -> JSONResponse:
	return JSONResponse(
		status_code=502,
		content={"error": "External API error", "detail": str(exc)},
	)


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(_: Request, __: RateLimitExceeded) -> JSONResponse:
	return JSONResponse(status_code=429, content={"error": "Rate limit exceeded"})


@app.exception_handler(Exception)
async def generic_exception_handler(_: Request, exc: Exception) -> JSONResponse:
	logger.exception("Unhandled exception in API", exc_info=exc)
	return JSONResponse(status_code=500, content={"error": "Internal server error"})

app.include_router(health.router)
app.include_router(jobs.router)
