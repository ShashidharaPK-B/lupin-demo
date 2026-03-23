import logging
from datetime import datetime
from typing import Any

from sqlalchemy import select

from app.agents.graph import workflow
from app.core.database import AsyncSessionLocal
from app.core.redis import cache_delete, cache_set
from app.models.analysis import AnalysisJob, JobStatus
from app.services.document_parser import document_parser

logger = logging.getLogger(__name__)


class AnalysisService:
    """Orchestrates document parsing and multi-agent AI cost analysis via LangGraph."""

    @staticmethod
    async def run_analysis(
        job_id: str,
        file_path: str,
        content_type: str,
        assumptions: dict[str, Any],
    ) -> None:
        """
        Background task: parse document -> run LangGraph agent workflow -> save result to DB.

        Workflow: Orchestrator → Planner → [Cost, Vendor, Process] Agents → Reporter
        """
        async with AsyncSessionLocal() as db:
            try:
                # 1. Mark job as processing
                result = await db.execute(select(AnalysisJob).where(AnalysisJob.id == job_id))
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

                # 3. Run LangGraph multi-agent workflow
                logger.info(f"Running agent workflow for job {job_id}")
                initial_state = {
                    "document_text": document_text,
                    "assumptions": assumptions,
                }

                final_state = await workflow.ainvoke(initial_state)

                # Check for workflow errors
                if final_state.get("error"):
                    raise ValueError(f"Agent workflow error: {final_state['error']}")

                # 4. Extract report from final state
                report = final_state.get("report", {})
                result_data = {
                    "material_cost": report.get("material_cost", 0),
                    "labor_cost": report.get("labor_cost", 0),
                    "overhead_cost": report.get("overhead_cost", 0),
                    "profit": report.get("profit", 0),
                    "total_cost": report.get("total_cost", 0),
                    "per_unit_cost": report.get("per_unit_cost", 0),
                    "currency": report.get("currency", "USD"),
                    "assumptions": report.get("assumptions", assumptions),
                    "line_items": report.get("line_items", []),
                    "summary": report.get("summary"),
                    "vendor_insights": report.get("vendor_insights"),
                    "process_insights": report.get("process_insights"),
                    # Agent metadata
                    "agent_plan": final_state.get("plan"),
                    "vendor_analysis": final_state.get("vendor_analysis"),
                    "process_optimization": final_state.get("process_optimization"),
                }

                job.status = JobStatus.completed
                job.result_json = result_data
                job.updated_at = datetime.utcnow()
                await db.commit()

                # 5. Cache the result in Redis
                await cache_set(f"analysis:{job_id}", {"status": "completed", "result": result_data})

                logger.info(f"Job {job_id} completed successfully")

            except Exception as exc:
                logger.exception(f"Job {job_id} failed: {exc}")
                try:
                    result = await db.execute(select(AnalysisJob).where(AnalysisJob.id == job_id))
                    job = result.scalar_one_or_none()
                    if job:
                        job.status = JobStatus.failed
                        job.error_message = str(exc)
                        job.updated_at = datetime.utcnow()
                        await db.commit()
                    await cache_delete(f"analysis:{job_id}")
                except Exception as inner_exc:
                    logger.exception(f"Failed to update job {job_id} status to failed: {inner_exc}")
