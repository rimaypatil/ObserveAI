import uuid
from typing import Dict, List, Optional
from pydantic import BaseModel


class DashboardOverviewResponse(BaseModel):
    project_count: int
    incident_count: int
    critical_incidents: int
    logs_today: int
    metrics_today: int
    traces_today: int
    rca_generated: int
    avg_resolution_time_minutes: float


class DashboardProjectsSummary(BaseModel):
    id: uuid.UUID
    name: str
    environment: str
    service_count: int
    incident_count: int
    is_healthy: bool


class DashboardTelemetrySummary(BaseModel):
    logs_count_24h: int
    metrics_count_24h: int
    traces_count_24h: int
    error_logs_count_24h: int
    avg_latency_ms: float


class DashboardHealthResponse(BaseModel):
    status: str
    database_connected: bool
    redis_connected: bool
    rabbitmq_connected: bool
    chromadb_connected: bool
