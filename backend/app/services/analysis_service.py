import logging
from datetime import datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import AsyncSessionLocal
from app.models.analysis import AnalysisJob, JobStatus
from app.services.azure_openai import azure_openai_service
from app.services.document_parser import document_parser

logger = logging.getLogger(__name__)


class AnalysisService:
    """Orchestrates document parsing and AI cost analysis."""

    @staticmethod
    async def run_analysis(
        job_id: str,
        file_path: str,
        content_type: str,
        assumptions: dict[str, Any],
    ) -> None:
        """
        Background task: parse document -> call Azure OpenAI -> save result to DB.

        Args:
            job_id: UUID of the AnalysisJob record
            file_path: Path to the uploaded document
            content_type: MIME type of the document
            assumptions: Dict with yield_pct, solvent_recovery_pct, city, profit_margin_pct
        """
        async with AsyncSessionLocal() as db:
            try:
                # 1. Mark job as processing
                result = await db.execute(
                    select(AnalysisJob).where(AnalysisJob.id == job_id)
                )
                job = result.scalar_one_or_none()
                if job is None:
                    logger.error(f"Job {job_id} not found in database")
                    return

                job.status = JobStatus.processing
                job.updated_at = datetime.utcnow()
                await db.commit()

                # 2. Parse document
                logger.info(f"Parsing document for job {job_id}: {file_path}")
                document_text = document_parser.parse(file_path, content_type)

                if not document_text.strip():
                    raise ValueError(
                        "No text could be extracted from the uploaded document. "
                        "Please ensure the file is not empty or password-protected."
                    )

                # 3. Call Azure OpenAI
                logger.info(f"Calling Azure OpenAI for job {job_id}")
                analysis_result = await azure_openai_service.analyze_document(
                    document_text=document_text,
                    assumptions=assumptions,
                )

                # 4. Save result
                job.status = JobStatus.completed
                job.result_json = analysis_result.model_dump()
                job.updated_at = datetime.utcnow()
                await db.commit()

                logger.info(f"Job {job_id} completed successfully")

            except Exception as exc:
                logger.exception(f"Job {job_id} failed: {exc}")
                try:
                    result = await db.execute(
                        select(AnalysisJob).where(AnalysisJob.id == job_id)
                    )
                    job = result.scalar_one_or_none()
                    if job:
                        job.status = JobStatus.failed
                        job.error_message = str(exc)
                        job.updated_at = datetime.utcnow()
                        await db.commit()
                except Exception as inner_exc:
                    logger.exception(
                        f"Failed to update job {job_id} status to failed: {inner_exc}"
                    )
