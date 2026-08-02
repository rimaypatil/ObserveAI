import uuid
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class RCAAgentState(BaseModel):
    """LangGraph Shared Graph State across all specialized agents."""

    incident_id: str
    project_id: str
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

    # Execution Orchestration
    executed_agents: List[str] = Field(default_factory=list)
    next_agent: str = "planner"

    # Final Output Report
    final_rca: Optional[Dict[str, Any]] = None
