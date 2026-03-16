import json
from typing import Any

from openai import AsyncAzureOpenAI

from app.core.config import settings
from app.schemas.analysis import AnalysisResult, CostLineItem


SYSTEM_PROMPT = """You are an expert pharmaceutical and chemical manufacturing cost analyst.
Your task is to analyze Recipe of Synthesis (ROS) documents and produce accurate should-cost estimates.

When analyzing documents:
1. Extract all raw materials, reagents, solvents, and their quantities
2. Identify process steps and estimate labor requirements
3. Calculate overhead costs based on equipment, utilities, and facility usage
4. Apply the parametric assumptions provided (yield, solvent recovery, location, profit margin)
5. Provide a detailed cost breakdown in structured JSON format

Always respond with valid JSON matching the specified schema. Use USD as the default currency.
Be thorough, precise, and base your calculations on industry-standard pharmaceutical manufacturing costs."""


ANALYSIS_PROMPT_TEMPLATE = """Analyze the following Recipe of Synthesis (ROS) document and calculate the should-cost.

## Parametric Assumptions
- Yield: {yield_pct}%
- Solvent Recovery: {solvent_recovery_pct}%
- Manufacturing City/Location: {city}
- Profit Margin: {profit_margin_pct}%

## ROS Document Content
{document_text}

## Instructions
Based on the above document and assumptions:
1. Extract all materials with quantities and estimated unit costs
2. Calculate adjusted material costs accounting for yield losses
3. Estimate labor costs for the specified location ({city})
4. Calculate overhead (utilities, equipment depreciation, QA/QC, regulatory)
5. Apply solvent recovery savings
6. Add profit margin
7. Provide per-unit cost

Respond with a JSON object with this exact structure:
{{
  "material_cost": <number>,
  "labor_cost": <number>,
  "overhead_cost": <number>,
  "profit": <number>,
  "total_cost": <number>,
  "per_unit_cost": <number>,
  "currency": "USD",
  "assumptions": {{
    "yield_pct": {yield_pct},
    "solvent_recovery_pct": {solvent_recovery_pct},
    "city": "{city}",
    "profit_margin_pct": {profit_margin_pct},
    "batch_size_kg": <estimated batch size>,
    "notes": "<any important assumptions made>"
  }},
  "line_items": [
    {{
      "name": "<material/step name>",
      "quantity": <number or null>,
      "unit": "<kg/L/hours/etc or null>",
      "unit_cost": <number or null>,
      "total_cost": <number>,
      "category": "<raw_material|solvent|labor|overhead|utilities|other>",
      "notes": "<optional notes>"
    }}
  ],
  "summary": "<2-3 sentence summary of the cost analysis>"
}}"""


class AzureOpenAIService:
    def __init__(self):
        self.client = AsyncAzureOpenAI(
            azure_endpoint=settings.azure_openai_endpoint,
            api_key=settings.azure_openai_api_key,
            api_version=settings.azure_openai_api_version,
        )
        self.deployment = settings.azure_openai_deployment_name

    async def analyze_document(
        self,
        document_text: str,
        assumptions: dict[str, Any],
    ) -> AnalysisResult:
        """
        Analyze a ROS document and return a structured cost breakdown.

        Args:
            document_text: Extracted text from the ROS document
            assumptions: Dict with yield_pct, solvent_recovery_pct, city, profit_margin_pct

        Returns:
            AnalysisResult with detailed cost breakdown
        """
        prompt = ANALYSIS_PROMPT_TEMPLATE.format(
            yield_pct=assumptions["yield_pct"],
            solvent_recovery_pct=assumptions["solvent_recovery_pct"],
            city=assumptions["city"],
            profit_margin_pct=assumptions["profit_margin_pct"],
            document_text=document_text[:12000],  # Trim to avoid token limits
        )

        response = await self.client.chat.completions.create(
            model=self.deployment,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.1,
            max_tokens=4096,
        )

        raw_content = response.choices[0].message.content or "{}"
        data = json.loads(raw_content)

        # Build line items
        line_items = [
            CostLineItem(
                name=item.get("name", "Unknown"),
                quantity=item.get("quantity"),
                unit=item.get("unit"),
                unit_cost=item.get("unit_cost"),
                total_cost=float(item.get("total_cost", 0)),
                category=item.get("category"),
                notes=item.get("notes"),
            )
            for item in data.get("line_items", [])
        ]

        return AnalysisResult(
            material_cost=float(data.get("material_cost", 0)),
            labor_cost=float(data.get("labor_cost", 0)),
            overhead_cost=float(data.get("overhead_cost", 0)),
            profit=float(data.get("profit", 0)),
            total_cost=float(data.get("total_cost", 0)),
            per_unit_cost=float(data.get("per_unit_cost", 0)),
            currency=data.get("currency", "USD"),
            assumptions=data.get("assumptions", assumptions),
            line_items=line_items,
            summary=data.get("summary"),
        )


# Singleton instance
azure_openai_service = AzureOpenAIService()
