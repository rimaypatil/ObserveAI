import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class OrganizationCreate(BaseModel):
    name: str = Field(..., min_length=2)
    slug: Optional[str] = None


class OrganizationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    slug: str
    plan: str
    max_projects: int
    created_at: datetime


class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=2)
    environment: str = "production"
    description: Optional[str] = None
    logo_url: Optional[str] = None


class UpdateProjectRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=2)
    environment: Optional[str] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None
    settings: Optional[dict] = None


class ProjectSettingsSchema(BaseModel):
    alert_severity_threshold: str = "P2"
    retention_days: int = 30
    auto_rca_enabled: bool = True
    slack_channel: Optional[str] = None


class ProjectResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    organization_id: uuid.UUID
    name: str
    slug: str
    environment: str
    description: Optional[str] = None
    logo_url: Optional[str] = None
    is_archived: bool = False
    archived_at: Optional[datetime] = None
    settings: Optional[dict] = None
    created_at: datetime


class RotateApiKeyResponse(BaseModel):
    id: uuid.UUID
    name: str
    prefix: str
    environment: str
    new_raw_key: str
    rotated_at: datetime


class ServiceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    project_id: uuid.UUID
    name: str
    type: str
    language: Optional[str] = None
    framework: Optional[str] = None
    is_healthy: bool
    last_seen_at: Optional[datetime] = None
