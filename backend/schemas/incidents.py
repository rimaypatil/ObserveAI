import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict


class RcaReportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    summary: str
    root_cause: str
    timeline_json: List[Dict[str, Any]]
    evidence_json: Dict[str, Any]
    historical_matches_json: List[Dict[str, Any]]
    fix_recommendations_json: List[str]
    prevention_actions_json: List[str]
    confidence_score: float
    confidence_level: str
    reasoning_tree_json: Optional[Dict[str, Any]] = None


class TimelineEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    event_type: str
    message: str
    metadata_json: Optional[Dict[str, Any]] = None
    created_at: datetime


class IncidentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    project_id: uuid.UUID
    service_id: uuid.UUID
    title: str
    description: Optional[str] = None
    severity: str
    priority: str = "MEDIUM"
    status: str
    assigned_to_id: Optional[uuid.UUID] = None
    owner_id: Optional[uuid.UUID] = None
    root_cause_summary: Optional[str] = None
    confidence_score: Optional[float] = None
    started_at: datetime
    resolved_at: Optional[datetime] = None
    environment: Optional[str] = None
    service_name: Optional[str] = None


class IncidentCommentCreate(BaseModel):
    comment: str


class IncidentCommentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    incident_id: uuid.UUID
    user_id: uuid.UUID
    comment: str
    created_at: datetime


class IncidentDetailResponse(IncidentResponse):
    timeline_events: List[TimelineEventResponse] = []
    rca_report: Optional[RcaReportResponse] = None
    comments: List[IncidentCommentResponse] = []


class IncidentUpdateStatusSchema(BaseModel):
    status: str  # INVESTIGATING, RESOLVED, CLOSED, REOPENED, ARCHIVED
    root_cause_summary: Optional[str] = None


class AssignIncidentRequest(BaseModel):
    assigned_to_id: uuid.UUID

