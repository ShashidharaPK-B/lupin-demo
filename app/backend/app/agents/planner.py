"""Planning Agent (Architecture Component 4).

Plans based on user inputs and updates based on observed outputs.
Analyzes the document to determine which analyst agents to invoke.
"""

import logging

from app.agents.llm import call_llm
from app.agents.state import AgentState

logger = logging.getLogger(__name__)

PLANNER_SYSTEM = """You are a procurement analysis planning agent.
Given a Recipe of Synthesis (ROS) document, analyze its content and create an execution plan.

Determine what analysis is needed:
1. cost_computation: Always required — extract materials, quantities, and compute costs
2. vendor_analysis: Required if multiple materials are listed — suggest alternate vendors/sources
3. process_optimization: Required if process steps are described — identify efficiency improvements

Respond with JSON:
{
  "document_type": "ROS/SOP/invoice/other",
  "product_name": "<identified product>",
  "material_count": <number of materials found>,
  "process_steps_found": true/false,
  "agents_to_invoke": ["cost_computation", "vendor_analysis", "process_optimization"],
  "notes": "<brief analysis of what the document contains>"
}"""


async def plan(state: AgentState) -> AgentState:
    """Analyze document and determine which analyst agents to invoke."""
    logger.info("Planner: Analyzing document to create execution plan")

    document_text = state["document_text"]
    assumptions = state["assumptions"]

    user_prompt = f"""Analyze this document and create an execution plan.

## Document (first 3000 chars)
{document_text[:3000]}

## User Assumptions
- Yield: {assumptions["yield_pct"]}%
- Solvent Recovery: {assumptions["solvent_recovery_pct"]}%
- Location: {assumptions["city"]}
- Profit Margin: {assumptions["profit_margin_pct"]}%
"""

    try:
        plan_result = await call_llm(PLANNER_SYSTEM, user_prompt)
        logger.info(f"Planner: Plan created — agents={plan_result.get('agents_to_invoke', [])}")
        return {**state, "plan": plan_result}
    except Exception as e:
        logger.error(f"Planner failed: {e}")
        # Default plan — always run cost computation
        return {
            **state,
            "plan": {
                "agents_to_invoke": ["cost_computation"],
                "notes": f"Planning failed ({e}), falling back to cost computation only",
            },
        }
