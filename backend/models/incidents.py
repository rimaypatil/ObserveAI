import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional
from sqlalchemy import DateTime, Float, ForeignKey, Index, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.database.base import BaseModel, JSONType


class Incident(BaseModel):
    __tablename__ = "incidents"

    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True
    )
    service_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("services.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    severity: Mapped[str] = mapped_column(String(10), default="P2", nullable=False, index=True)  # P0, P1, P2, P3
    priority: Mapped[str] = mapped_column(String(20), default="MEDIUM", nullable=False, index=True) # LOW, MEDIUM, HIGH, CRITICAL
    status: Mapped[str] = mapped_column(String(50), default="CREATED", nullable=False, index=True)  # CREATED, INVESTIGATING, AI_PROCESSING, RESOLVED, CLOSED, REOPENED, ARCHIVED
    root_cause_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    confidence_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    assigned_to_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    owner_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.now, nullable=False, index=True)
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    project: Mapped["Project"] = relationship("Project")
    service: Mapped["Service"] = relationship("Service")
    timeline_events: Mapped[List["IncidentTimeline"]] = relationship("IncidentTimeline", back_populates="incident", cascade="all, delete-orphan")
    rca_report: Mapped[Optional["RcaReport"]] = relationship("RcaReport", back_populates="incident", uselist=False, cascade="all, delete-orphan")
    comments: Mapped[List["IncidentComment"]] = relationship("IncidentComment", back_populates="incident", cascade="all, delete-orphan")

    @property
    def environment(self) -> Optional[str]:
        return self.project.environment if self.project else None

    @property
    def service_name(self) -> Optional[str]:
        return self.service.name if self.service else None

    __table_args__ = (
        Index("idx_incidents_project_status", "project_id", "status"),
        Index("idx_incidents_severity", "project_id", "severity"),
    )


class IncidentTimeline(BaseModel):
    __tablename__ = "incident_timelines"

    incident_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False, index=True
    )
    event_type: Mapped[str] = mapped_column(String(100), nullable=False)  # TRIGGERED, AGENT_DISPATCHED, RAG_RETRIEVED, RCA_GENERATED, RESOLVED
    message: Mapped[str] = mapped_column(Text, nullable=False)
    metadata_json: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSONType, nullable=True)

    incident: Mapped["Incident"] = relationship("Incident", back_populates="timeline_events")


class RcaReport(BaseModel):
    __tablename__ = "rca_reports"

    incident_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("incidents.id", ondelete="CASCADE"), unique=True, nullable=False, index=True
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True
    )
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    root_cause: Mapped[str] = mapped_column(Text, nullable=False)
    timeline_json: Mapped[List[Dict[str, Any]]] = mapped_column(JSONType, nullable=False)
    evidence_json: Mapped[Dict[str, Any]] = mapped_column(JSONType, nullable=False)
    historical_matches_json: Mapped[List[Dict[str, Any]]] = mapped_column(JSONType, nullable=False)
    fix_recommendations_json: Mapped[List[str]] = mapped_column(JSONType, nullable=False)
    prevention_actions_json: Mapped[List[str]] = mapped_column(JSONType, nullable=False)
    confidence_score: Mapped[float] = mapped_column(Float, nullable=False)
    confidence_level: Mapped[str] = mapped_column(String(20), default="HIGH", nullable=False)  # HIGH, MEDIUM, LOW
    reasoning_tree_json: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSONType, nullable=True)

    incident: Mapped["Incident"] = relationship("Incident", back_populates="rca_report")


class IncidentComment(BaseModel):
    __tablename__ = "incident_comments"

    incident_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    comment: Mapped[str] = mapped_column(Text, nullable=False)

    incident: Mapped["Incident"] = relationship("Incident", back_populates="comments")
    user: Mapped["User"] = relationship("User")

