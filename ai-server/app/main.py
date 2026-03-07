# BASE
from fastapi import FastAPI, Depends, APIRouter
from pathlib import Path

# Prisma DB
from .db.prisma_connect import lifespan

# CONFIG
from .middleware.secure_keys import checkApiKey
from .api.v1.health import router as health_router
from .middleware.audit_log import AuditLogMiddleware

# Init FastAPI app
app = FastAPI(title="Tryora AI server", description="A server for managing AI operations for the Tryora platform", version="1.0.0", lifespan=lifespan)

app.add_middleware(AuditLogMiddleware)

app.include_router(health_router, prefix="/api/v1")

@app.get("/data")
async def get_data(server_name: str = Depends(checkApiKey)):
    return {"message": f"Hello {server_name}, here is your data."}


@app.get("/")
async def get():
    return {"message": "Hello, here is your data."}

# ---------------------------------------------------------------------------
# All routes and routers registered below this line require a valid API key.
# The dependency runs once per request and raises 403 if the key is missing
# or invalid, before any route handler is executed.
# ---------------------------------------------------------------------------
protected_router = APIRouter(dependencies=[Depends(checkApiKey)])


# Register the protected router — add all future routers here too:
# protected_router.include_router(avatar_router, prefix="/internal/ai")
# protected_router.include_router(tryon_router,  prefix="/internal/ai")
# protected_router.include_router(scrape_router, prefix="/internal/ai")



app.include_router(protected_router)