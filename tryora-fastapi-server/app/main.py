from fastapi import FastAPI

from app.routers import health, jobs


app = FastAPI(title="Tryora FastAPI Server", version="0.1.0")

app.include_router(health.router)
app.include_router(jobs.router)
