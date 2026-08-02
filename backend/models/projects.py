import uuid
from datetime import datetime
from typing import List, Optional
from sqlalchemy import Boolean, DateTime, ForeignKey, Index, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.database.base import BaseModel


class Project(BaseModel):
    __tablename__ = "projects"

    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    environment: Mapped[str] = mapped_column(String(50), default="production", nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_archived: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    archived_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    logo_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    settings: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True, default=dict)

    # Relationships
    organization: Mapped["Organization"] = relationship("Organization", back_populates="projects")
    api_keys: Mapped[List["ApiKey"]] = relationship("ApiKey", back_populates="project", cascade="all, delete-orphan")
    services: Mapped[List["Service"]] = relationship("Service", back_populates="project", cascade="all, delete-orphan")
    environments: Mapped[List["Environment"]] = relationship("Environment", back_populates="project", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_project_org_slug", "organization_id", "slug", unique=True),
    )


class ApiKey(BaseModel):
    __tablename__ = "api_keys"

    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    key_hash: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    prefix: Mapped[str] = mapped_column(String(16), nullable=False)
    environment: Mapped[str] = mapped_column(String(50), default="production", nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    last_used_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    project: Mapped["Project"] = relationship("Project", back_populates="api_keys")


class Service(BaseModel):
    __tablename__ = "services"

    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    type: Mapped[str] = mapped_column(String(50), default="backend", nullable=False)  # backend, frontend, worker, database, microservice
    language: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # python, node, java, go
    framework: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # fastapi, express, spring
    is_healthy: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    last_seen_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    project: Mapped["Project"] = relationship("Project", back_populates="services")
    deployments: Mapped[List["Deployment"]] = relationship("Deployment", back_populates="service", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_service_project_name", "project_id", "name", unique=True),
    )


class Environment(BaseModel):
    __tablename__ = "environments"

    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), nullable=False)

    project: Mapped["Project"] = relationship("Project", back_populates="environments")


class Deployment(BaseModel):
    __tablename__ = "deployments"

    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True
    )
    service_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("services.id", ondelete="CASCADE"), nullable=False, index=True
    )
    version: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    commit_hash: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    commit_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    author: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="deployed", nullable=False)  # pending, deployed, failed, rolled_back
    deployed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.now, nullable=False)

    project: Mapped["Project"] = relationship("Project")
    service: Mapped["Service"] = relationship("Service", back_populates="deployments")


class SDKVersion(BaseModel):
    __tablename__ = "sdk_versions"

    language: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    version: Mapped[str] = mapped_column(String(50), nullable=False)
    min_compatible_backend: Mapped[str] = mapped_column(String(50), nullable=False)
    is_deprecated: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
