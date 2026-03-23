"""Cost Computation Agent (Architecture Component 5 — Worker Agent).

Extracts materials, quantities, and computes detailed cost breakdown.
"""

import logging

from app.agents.llm import call_llm
from app.agents.state import AgentState

logger = logging.getLogger(__name__)

COST_SYSTEM = """You are a cost computation agent specialized in pharmaceutical/chemical manufacturing.
Extract all materials from the ROS document and compute a detailed should-cost breakdown.

For each material, estimate:
- Current market price (USD/kg or USD/L)
- Required quantity adjusted for yield losses
- Solvent recovery savings where applicable

Also estimate:
- Labor costs based on manufacturing location
- Overhead (utilities, equipment, QA/QC, regulatory)

Respond with JSON:
{
  "materials": [
    {
      "name": "<material name>",
      "quantity": <number>,
      "unit": "kg/L/units",
      "unit_cost": <USD>,
      "total_cost": <USD>,
      "category": "raw_material/solvent/reagent/catalyst",
      "yield_adjusted": true/false,
      "notes": "<optional>"
    }
  ],
  "labor": {
    "hours": <number>,
    "hourly_rate": <USD>,
    "total": <USD>,
    "location_factor": <multiplier for the city>
  },
  "overhead": {
    "utilities": <USD>,
    "equipment_depreciation": <USD>,
    "qa_qc": <USD>,
    "regulatory": <USD>,
    "total": <USD>
  },
  "subtotals": {
    "material_cost": <USD>,
    "labor_cost": <USD>,
    "overhead_cost": <USD>,
    "solvent_recovery_savings": <USD>,
    "total_before_margin": <USD>
  }
}"""


async def compute_costs(state: AgentState) -> AgentState:
    """Extract materials and compute detailed cost breakdown."""
    logger.info("CostComputation: Computing should-cost breakdown")

    assumptions = state["assumptions"]
    user_prompt = f"""Compute the should-cost for this ROS document.

## Assumptions
- Yield: {assumptions["yield_pct"]}%
- Solvent Recovery: {assumptions["solvent_recovery_pct"]}%
- Location: {assumptions["city"]}
- Profit Margin: {assumptions["profit_margin_pct"]}%

## Document
{state["document_text"]}
"""

    try:
        result = await call_llm(COST_SYSTEM, user_prompt)
        materials = result.get("materials", [])
        logger.info(f"CostComputation: Found {len(materials)} materials")
        return {
            **state,
            "materials": materials,
            "cost_breakdown": {
                "labor": result.get("labor", {}),
                "overhead": result.get("overhead", {}),
                "subtotals": result.get("subtotals", {}),
            },
        }
    except Exception as e:
        logger.error(f"CostComputation failed: {e}")
        return {**state, "materials": [], "cost_breakdown": {"error": str(e)}}
