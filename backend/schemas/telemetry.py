from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class LogItemSchema(BaseModel):
    timestamp: Optional[str] = None
    level: str = "INFO"
    message: str
    logger_name: Optional[str] = None
    trace_id: Optional[str] = None
    span_id: Optional[str] = None
    attributes: Optional[Dict[str, Any]] = None


class ExceptionItemSchema(BaseModel):
    timestamp: Optional[str] = None
    exception_type: str
    message: str
    stacktrace: str
    file_name: Optional[str] = None
    line_number: Optional[int] = None
    function_name: Optional[str] = None
    handled: bool = False
    trace_id: Optional[str] = None


class TraceItemSchema(BaseModel):
    timestamp: Optional[str] = None
    trace_id: str
    span_id: str
    parent_span_id: Optional[str] = None
    operation_name: str
    duration_ms: float
    status_code: int = 200
    attributes: Optional[Dict[str, Any]] = None


class MetricItemSchema(BaseModel):
    timestamp: Optional[str] = None
    name: str
    metric_type: str = "gauge"
    value: float
    unit: Optional[str] = None
    tags: Optional[Dict[str, Any]] = None


class DeploymentItemSchema(BaseModel):
    version: str
    commit_hash: Optional[str] = None
    commit_message: Optional[str] = None
    author: Optional[str] = None
    status: str = "deployed"


class IngestPayloadSchema(BaseModel):
    api_key: Optional[str] = Field(default=None, description="Project SDK API Key")
    service_name: str = Field(..., description="Target microservice name")
    environment: str = Field(default="production")
    logs: List[LogItemSchema] = Field(default_factory=list)
    exceptions: List[ExceptionItemSchema] = Field(default_factory=list)
    traces: List[TraceItemSchema] = Field(default_factory=list)
    metrics: List[MetricItemSchema] = Field(default_factory=list)
    deployments: List[DeploymentItemSchema] = Field(default_factory=list)
