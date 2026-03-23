import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.redis import close_redis, redis_health


@asynccontextmanager
async def lifespan(app: FastAPI):
    os.makedirs(settings.upload_dir, exist_ok=True)
    yield
    await close_redis()


app = FastAPI(
    title="AI Should Cost Engine",
    description="Pharmaceutical/Chemical manufacturing should-cost estimation API",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.get("/health", tags=["health"])
async def health_check():
    """Health check endpoint with Redis and DB status."""
    redis_ok = await redis_health()
    return {
        "status": "healthy",
        "service": "ai-should-cost-engine",
        "redis": "connected" if redis_ok else "disconnected",
    }
