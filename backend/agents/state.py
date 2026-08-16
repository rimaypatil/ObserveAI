import uuid
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class RCAAgentState(BaseModel):
    """LangGraph Shared Graph State across all specialized agents."""

    incident_id: str
    project_id: str
    organization_id: Optional[str] = None
    service_id: str
    service_name: str = "unknown-service"
    title: str = "Operational Incident"
    severity: str = "P2"
    started_at: str = ""

    # Telemetry Context
    logs: List[Dict[str, Any]] = Field(default_factory=list)
    exceptions: List[Dict[str, Any]] = Field(default_factory=list)
    traces: List[Dict[str, Any]] = Field(default_factory=list)
    metrics: Dict[str, Any] = Field(default_factory=dict)
    deployments: List[Dict[str, Any]] = Field(default_factory=list)

    # RAG & Knowledge Context
    rag_context: str = ""
    rag_documents: List[Dict[str, Any]] = Field(default_factory=list)

    # Confidence Metrics
    confidence_meta: Dict[str, Any] = Field(default_factory=dict)

    # Execution Orchestration & Domain Analysis
    execution_plan: Dict[str, Any] = Field(default_factory=dict)
    log_analysis: Dict[str, Any] = Field(default_factory=dict)
    trace_analysis: Dict[str, Any] = Field(default_factory=dict)
    exception_analysis: Dict[str, Any] = Field(default_factory=dict)
    metric_analysis: Dict[str, Any] = Field(default_factory=dict)
    deployment_analysis: Dict[str, Any] = Field(default_factory=dict)
    rag_analysis: Dict[str, Any] = Field(default_factory=dict)
    confidence_analysis: Dict[str, Any] = Field(default_factory=dict)
    agent_reasoning: List[Dict[str, Any]] = Field(default_factory=list)

    executed_agents: List[str] = Field(default_factory=list)
    next_agent: str = "planner"

    # Final Output Report
    final_rca: Optional[Dict[str, Any]] = None
