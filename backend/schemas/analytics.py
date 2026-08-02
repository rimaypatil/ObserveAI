from typing import Any, Dict, List
from pydantic import BaseModel


class OverviewStatsResponse(BaseModel):
    total_services: int
    healthy_services: int
    unhealthy_services: int
    active_incidents: int
    resolved_incidents: int
    total_logs_24h: int
    total_exceptions_24h: int
    ai_rca_accuracy_rate: float


class IncidentTrendItem(BaseModel):
    date: str
    total_incidents: int
    p0_count: int
    p1_count: int
    p2_count: int
    p3_count: int


class ServiceHealthResponse(BaseModel):
    service_id: str
    service_name: str
    is_healthy: bool
    error_rate: float
    p95_latency_ms: float
    active_incident_count: int
