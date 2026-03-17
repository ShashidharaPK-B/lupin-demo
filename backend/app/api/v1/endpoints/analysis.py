import os
import uuid
from datetime import datetime

import aiofiles
from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
)
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.models.analysis import AnalysisJob, JobStatus
from app.schemas.analysis import AnalysisJobCreate, AnalysisJobResponse
from app.services.analysis_service import AnalysisService

router = APIRouter()


async def save_upload_file(upload_file: UploadFile) -> tuple[str, str]:
    """Save uploaded file to disk and return (filename, filepath)."""
    ext = os.path.splitext(upload_file.filename or "document")[1]
    unique_name = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(settings.upload_dir, unique_name)

    os.makedirs(settings.upload_dir, exist_ok=True)

    async with aiofiles.open(file_path, "wb") as f:
        content = await upload_file.read()
        await f.write(content)

    return upload_file.filename or unique_name, file_path


@router.post("/calculate", response_model=AnalysisJobResponse, status_code=202)
async def calculate_should_cost(
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    file: UploadFile = File(..., description="ROS document (PDF, Excel, or Word)"),
    yield_pct: float = Form(...),
    solvent_recovery_pct: float = Form(...),
    city: str = Form(...),
    profit_margin_pct: float = Form(...),
    project_id: str | None = Form(None),
):
    """
    Upload a ROS document and parametric assumptions.
    Creates an analysis job and processes it in the background.
    Returns the job immediately with status 'pending'.
    """
    # Validate content type
    allowed_types = {
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword",
    }
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file.content_type}. Allowed: PDF, Excel (.xlsx/.xls), Word (.docx/.doc)",
        )

    # Save file
    filename, file_path = await save_upload_file(file)

    # Build assumptions
    assumptions = AnalysisJobCreate(
        yield_pct=yield_pct,
        solvent_recovery_pct=solvent_recovery_pct,
        city=city,
        profit_margin_pct=profit_margin_pct,
    )

    # Create DB record
    job = AnalysisJob(
        id=str(uuid.uuid4()),
        project_id=project_id,
        status=JobStatus.pending,
        yield_pct=assumptions.yield_pct,
        solvent_recovery_pct=assumptions.solvent_recovery_pct,
        city=assumptions.city,
        profit_margin_pct=assumptions.profit_margin_pct,
        document_filename=filename,
        document_path=file_path,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(job)
    await db.commit()
    await db.refresh(job)

    # Enqueue background task
    background_tasks.add_task(
        AnalysisService.run_analysis,
        job_id=job.id,
        file_path=file_path,
        content_type=file.content_type or "",
        assumptions=assumptions.model_dump(),
    )

    return job


@router.get("/{job_id}", response_model=AnalysisJobResponse)
async def get_analysis_job(
    job_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Get the status and result of an analysis job."""
    result = await db.execute(select(AnalysisJob).where(AnalysisJob.id == job_id))
    job = result.scalar_one_or_none()
    if job is None:
        raise HTTPException(status_code=404, detail=f"Analysis job '{job_id}' not found")
    return job


@router.get("/", response_model=list[AnalysisJobResponse])
async def list_analysis_jobs(
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 50,
):
    """List all analysis jobs, most recent first."""
    result = await db.execute(select(AnalysisJob).order_by(AnalysisJob.created_at.desc()).offset(skip).limit(limit))
    return result.scalars().all()
