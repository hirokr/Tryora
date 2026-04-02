from fastapi import Depends, FastAPI

from app.api.router import router as api_router
from app.db.prisma_connect import lifespan
from app.middleware.audit_log import AuditLogMiddleware
from app.shared.security.api_key import checkApiKey


def create_app() -> FastAPI:
    app = FastAPI(
        title="Tryora AI server",
        description="A server for managing AI operations for the Tryora platform",
        version="1.0.0",
        lifespan=lifespan,
    )
    app.add_middleware(AuditLogMiddleware)
    app.include_router(api_router)

    @app.get("/")
    async def root() -> dict[str, str]:
        return {"message": "Hello, here is your data."}

    @app.get("/data")
    async def get_data(server_name: str = Depends(checkApiKey)) -> dict[str, str]:
        return {"message": f"Hello {server_name}, here is your data."}

    return app


app = create_app()
