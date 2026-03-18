import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create upload directory if it doesn't exist
    os.makedirs(settings.upload_dir, exist_ok=True)
    yield
    # Shutdown: cleanup if needed


app = FastAPI(
    title="AI Should Cost Engine",
    description="Pharmaceutical/Chemical manufacturing should-cost estimation API",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router)


@app.get("/health", tags=["health"])
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "ai-should-cost-engine"}


@app.get("/version", tags=["health"])
async def version():
    """Return app version and environment."""
    return {
        "version": "0.1.0",
        "environment": os.getenv("ENVIRONMENT", "development"),
    }
