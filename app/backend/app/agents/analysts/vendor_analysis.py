"""Alternate Vendor Agent (Architecture Component 5 — Worker Agent).

Suggests alternate vendors and best-price options for materials.
"""

import logging

from app.agents.llm import call_llm
from app.agents.state import AgentState

logger = logging.getLogger(__name__)

VENDOR_SYSTEM = """You are a vendor analysis agent for pharmaceutical/chemical procurement.
Given a list of materials, suggest alternate vendors and potential cost savings.

For each material, provide:
- Current estimated vendor/source
- 1-2 alternate vendors with estimated pricing
- Potential savings percentage

Respond with JSON:
{
  "vendor_suggestions": [
    {
      "material": "<name>",
      "current_vendor": "<estimated current source>",
      "current_price": <USD per unit>,
      "alternates": [
        {
          "vendor": "<vendor name>",
          "price": <USD per unit>,
          "savings_pct": <percentage>,
          "notes": "<quality/lead time considerations>"
        }
      ]
    }
  ],
  "total_potential_savings": <USD>,
  "savings_summary": "<brief summary>"
}"""


async def analyze_vendors(state: AgentState) -> AgentState:
    """Suggest alternate vendors for materials identified by cost computation."""
    logger.info("VendorAnalysis: Analyzing alternate vendors")

    materials = state.get("materials", [])
    if not materials:
        logger.info("VendorAnalysis: No materials to analyze, skipping")
        return {**state, "vendor_analysis": {"vendor_suggestions": [], "total_potential_savings": 0}}

    material_list = "\n".join([f"- {m.get('name', 'Unknown')}: {m.get('quantity', '?')} {m.get('unit', '')}" for m in materials])

    user_prompt = f"""Suggest alternate vendors for these materials used in {state['assumptions'].get('city', 'unknown')}:

{material_list}
"""

    try:
        result = await call_llm(VENDOR_SYSTEM, user_prompt)
        logger.info(f"VendorAnalysis: Found {len(result.get('vendor_suggestions', []))} vendor suggestions")
        return {**state, "vendor_analysis": result}
    except Exception as e:
        logger.error(f"VendorAnalysis failed: {e}")
        return {**state, "vendor_analysis": {"error": str(e)}}
