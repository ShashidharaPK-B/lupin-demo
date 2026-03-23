"""Shared state schema for the multi-agent workflow."""

from typing import Any

from typing_extensions import TypedDict


class AgentState(TypedDict, total=False):
    """State passed through the LangGraph workflow.

    Maps to architecture components:
    - document_text: Raw parsed document (from Document Parser)
    - assumptions: User-provided parametric inputs
    - plan: Output of Planning Agent (4) — which analysts to invoke
    - materials: Output of Cost Computation Agent (5)
    - vendor_analysis: Output of Alternate Vendor Agent (5)
    - process_optimization: Output of Process Agent (5)
    - cost_breakdown: Aggregated cost data from analyst agents
    - report: Final narrative from Reporting Agent
    - error: Error message if any step fails
    """

    # Inputs
    document_text: str
    assumptions: dict[str, Any]

    # Planning Agent output
    plan: dict[str, Any]

    # Analyst Agent outputs
    materials: list[dict[str, Any]]
    vendor_analysis: dict[str, Any]
    process_optimization: dict[str, Any]

    # Aggregated results
    cost_breakdown: dict[str, Any]

    # Reporting Agent output
    report: dict[str, Any]

    # Error tracking
    error: str
