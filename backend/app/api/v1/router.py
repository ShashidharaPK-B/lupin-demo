from fastapi import APIRouter

from app.api.v1.endpoints import analysis, projects

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(analysis.router, prefix="/analysis", tags=["analysis"])
api_router.include_router(projects.router, prefix="/projects", tags=["projects"])
