"""Process Optimization Agent (Architecture Component 5 — Worker Agent).

Identifies process optimization opportunities and efficiency improvements.
"""

import logging

from app.agents.llm import call_llm
from app.agents.state import AgentState

logger = logging.getLogger(__name__)

PROCESS_SYSTEM = """You are a process optimization agent for pharmaceutical/chemical manufacturing.
Analyze the manufacturing process described in the document and suggest optimizations.

Consider:
- Reaction time optimization
- Energy efficiency improvements
- Waste reduction opportunities
- Solvent recovery improvements beyond current assumptions
- Equipment utilization improvements
- Batch size optimization

Respond with JSON:
{
  "process_steps": [
    {
      "step": "<step name>",
      "current_approach": "<what the document describes>",
      "optimization": "<suggested improvement>",
      "estimated_savings_pct": <percentage>,
      "category": "time/energy/waste/yield/equipment"
    }
  ],
  "overall_efficiency_gain": <estimated percentage improvement>,
  "summary": "<brief summary of key optimizations>"
}"""


async def optimize_process(state: AgentState) -> AgentState:
    """Analyze process steps and suggest optimizations."""
    logger.info("ProcessAgent: Analyzing process for optimizations")

    user_prompt = f"""Analyze the manufacturing process in this document for optimization opportunities.

## Current Assumptions
- Yield: {state['assumptions']['yield_pct']}%
- Solvent Recovery: {state['assumptions']['solvent_recovery_pct']}%

## Document
{state['document_text'][:8000]}
"""

    try:
        result = await call_llm(PROCESS_SYSTEM, user_prompt)
        steps = result.get("process_steps", [])
        logger.info(f"ProcessAgent: Found {len(steps)} optimization opportunities")
        return {**state, "process_optimization": result}
    except Exception as e:
        logger.error(f"ProcessAgent failed: {e}")
        return {**state, "process_optimization": {"error": str(e)}}
