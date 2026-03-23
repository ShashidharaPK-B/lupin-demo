"""Reporting Agent (Architecture Component — Reporting Agent).

Generates a context-specific narrative report based on all agent outputs.
Consolidates cost breakdown, vendor suggestions, and process optimizations
into the final AnalysisResult format.
"""

import logging
from typing import Any

from app.agents.llm import call_llm
from app.agents.state import AgentState

logger = logging.getLogger(__name__)

REPORTER_SYSTEM = """You are a reporting agent that consolidates procurement analysis results.
Combine the cost breakdown, vendor analysis, and process optimization into a final report.

You MUST respond with this exact JSON structure:
{
  "material_cost": <total material cost in USD>,
  "labor_cost": <total labor cost in USD>,
  "overhead_cost": <total overhead cost in USD>,
  "profit": <profit amount in USD>,
  "total_cost": <grand total in USD>,
  "per_unit_cost": <cost per kg/unit in USD>,
  "currency": "USD",
  "assumptions": {
    "yield_pct": <number>,
    "solvent_recovery_pct": <number>,
    "city": "<location>",
    "profit_margin_pct": <number>,
    "batch_size_kg": <estimated batch size>,
    "notes": "<key assumptions>"
  },
  "line_items": [
    {
      "name": "<item name>",
      "quantity": <number or null>,
      "unit": "<unit or null>",
      "unit_cost": <number or null>,
      "total_cost": <number>,
      "category": "raw_material/solvent/labor/overhead/utilities/other",
      "notes": "<optional>"
    }
  ],
  "vendor_insights": "<summary of alternate vendor opportunities>",
  "process_insights": "<summary of process optimization opportunities>",
  "summary": "<3-4 sentence executive summary covering cost, vendor, and process findings>"
}"""


async def generate_report(state: AgentState) -> AgentState:
    """Consolidate all agent outputs into a final report."""
    logger.info("Reporter: Generating final report")

    materials = state.get("materials", [])
    cost_breakdown = state.get("cost_breakdown", {})
    vendor_analysis = state.get("vendor_analysis", {})
    process_optimization = state.get("process_optimization", {})
    assumptions = state["assumptions"]
    plan = state.get("plan", {})

    user_prompt = f"""Consolidate these analysis results into a final should-cost report.

## Planning Summary
Product: {plan.get('product_name', 'Unknown')}
Document type: {plan.get('document_type', 'ROS')}

## Assumptions
- Yield: {assumptions['yield_pct']}%
- Solvent Recovery: {assumptions['solvent_recovery_pct']}%
- Location: {assumptions['city']}
- Profit Margin: {assumptions['profit_margin_pct']}%

## Cost Computation Results
Materials: {_safe_json(materials)}
Cost breakdown: {_safe_json(cost_breakdown)}

## Vendor Analysis
{_safe_json(vendor_analysis)}

## Process Optimization
{_safe_json(process_optimization)}

Generate the final consolidated report with accurate totals.
"""

    try:
        report = await call_llm(REPORTER_SYSTEM, user_prompt)
        logger.info(f"Reporter: Final report generated — total_cost={report.get('total_cost')}")
        return {**state, "report": report}
    except Exception as e:
        logger.error(f"Reporter failed: {e}")
        # Build a minimal report from available data
        subtotals = cost_breakdown.get("subtotals", {})
        material_cost = float(subtotals.get("material_cost", 0))
        labor_cost = float(subtotals.get("labor_cost", 0))
        overhead_cost = float(subtotals.get("overhead_cost", 0))
        total_before_margin = material_cost + labor_cost + overhead_cost
        profit = total_before_margin * (assumptions.get("profit_margin_pct", 0) / 100)

        return {
            **state,
            "report": {
                "material_cost": material_cost,
                "labor_cost": labor_cost,
                "overhead_cost": overhead_cost,
                "profit": profit,
                "total_cost": total_before_margin + profit,
                "per_unit_cost": 0,
                "currency": "USD",
                "assumptions": assumptions,
                "line_items": [{"name": m.get("name", "?"), "total_cost": m.get("total_cost", 0), "category": m.get("category")} for m in materials],
                "summary": f"Report generation partially failed ({e}). Cost data from analyst agents shown.",
            },
        }


def _safe_json(obj: Any) -> str:
    """Convert to string safely for prompt inclusion."""
    import json

    try:
        return json.dumps(obj, indent=2, default=str)[:4000]
    except Exception:
        return str(obj)[:4000]
