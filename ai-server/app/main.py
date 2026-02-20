from fastapi import FastAPI, Depends
from .middleware.secure_keys import checkApiKey
from .api.v1.health import router as health_router
from .middleware.audit_log import AuditLogMiddleware

app = FastAPI(title="Tryora AI server", description="A server for managing AI operations for the Tryora platform", version="1.0.0")

app.add_middleware(AuditLogMiddleware)

app.include_router(health_router, prefix="/api/v1")

@app.get("/data")
async def get_data(server_name: str = Depends(checkApiKey)):
    return {"message": f"Hello {server_name}, here is your data."}

@app.get("/")
async def get():
    return {"message": "Hello, here is your data."}
