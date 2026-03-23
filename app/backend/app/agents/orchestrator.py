"""Orchestration Agent (Architecture Component 3).

Identifies app-specific context, available agents, and manages the workflow.
This is the entry node of the LangGraph — validates inputs and prepares state.
"""

import logging

from app.agents.state import AgentState

logger = logging.getLogger(__name__)


async def orchestrate(state: AgentState) -> AgentState:
    """Entry point: validate inputs and prepare context for the planning agent."""
    logger.info("Orchestrator: Starting analysis workflow")

    document_text = state.get("document_text", "")
    assumptions = state.get("assumptions", {})

    if not document_text.strip():
        return {**state, "error": "No document text provided"}

    required = ["yield_pct", "solvent_recovery_pct", "city", "profit_margin_pct"]
    missing = [k for k in required if k not in assumptions]
    if missing:
        return {**state, "error": f"Missing assumptions: {', '.join(missing)}"}

    # Truncate very large documents
    if len(document_text) > 15000:
        document_text = document_text[:15000]
        logger.info("Orchestrator: Document truncated to 15000 chars")

    logger.info(f"Orchestrator: Document length={len(document_text)}, assumptions={assumptions}")
    return {**state, "document_text": document_text}
