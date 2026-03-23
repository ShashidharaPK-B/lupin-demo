"""LangGraph workflow definition (Architecture Components 3-5 + Reporting).

Graph flow:
  orchestrate → plan → [cost_computation, vendor_analysis, process_optimization] → report

The planning agent determines which analyst agents to invoke.
Analyst agents run in sequence (could be parallel with async in future).
The reporter consolidates all outputs.
"""

import logging

from langgraph.graph import END, StateGraph

from app.agents.analysts.cost_computation import compute_costs
from app.agents.analysts.process_agent import optimize_process
from app.agents.analysts.vendor_analysis import analyze_vendors
from app.agents.orchestrator import orchestrate
from app.agents.planner import plan
from app.agents.reporter import generate_report
from app.agents.state import AgentState

logger = logging.getLogger(__name__)


def should_continue(state: AgentState) -> str:
    """Check if orchestrator found an error — if so, skip to end."""
    if state.get("error"):
        return "end"
    return "plan"


def route_analysts(state: AgentState) -> str:
    """Always run cost computation first."""
    return "cost_computation"


def after_cost(state: AgentState) -> str:
    """After cost computation, check plan for vendor analysis."""
    agents = state.get("plan", {}).get("agents_to_invoke", [])
    if "vendor_analysis" in agents:
        return "vendor_analysis"
    if "process_optimization" in agents:
        return "process_optimization"
    return "report"


def after_vendor(state: AgentState) -> str:
    """After vendor analysis, check plan for process optimization."""
    agents = state.get("plan", {}).get("agents_to_invoke", [])
    if "process_optimization" in agents:
        return "process_optimization"
    return "report"


def build_graph() -> StateGraph:
    """Build the LangGraph workflow."""
    graph = StateGraph(AgentState)

    # Add nodes (each maps to an architecture component)
    graph.add_node("orchestrate", orchestrate)
    graph.add_node("plan", plan)
    graph.add_node("cost_computation", compute_costs)
    graph.add_node("vendor_analysis", analyze_vendors)
    graph.add_node("process_optimization", optimize_process)
    graph.add_node("report", generate_report)

    # Set entry point
    graph.set_entry_point("orchestrate")

    # Orchestrator → Plan or End (if error)
    graph.add_conditional_edges("orchestrate", should_continue, {"plan": "plan", "end": END})

    # Plan → Cost Computation (always)
    graph.add_conditional_edges("plan", route_analysts, {"cost_computation": "cost_computation"})

    # Cost → Vendor or Process or Report
    graph.add_conditional_edges(
        "cost_computation",
        after_cost,
        {"vendor_analysis": "vendor_analysis", "process_optimization": "process_optimization", "report": "report"},
    )

    # Vendor → Process or Report
    graph.add_conditional_edges(
        "vendor_analysis",
        after_vendor,
        {"process_optimization": "process_optimization", "report": "report"},
    )

    # Process → Report
    graph.add_edge("process_optimization", "report")

    # Report → End
    graph.add_edge("report", END)

    return graph


# Compiled graph — ready to invoke
workflow = build_graph().compile()
