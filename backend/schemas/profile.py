import uuid
from datetime import datetime
from typing import Any, Dict, Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class NotificationPreferencesSchema(BaseModel):
    email: bool = True
    slack: bool = False
    webhook: bool = False
    slack_webhook_url: Optional[str] = None
    custom_webhook_url: Optional[str] = None
    severity_filter: str = "P2"  # P0, P1, P2, P3
    daily_summary: bool = True
    instant_alerts: bool = True


class ProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: EmailStr
    full_name: str
    role: str
    organization_id: Optional[uuid.UUID] = None
    organization_name: Optional[str] = None
    avatar_url: Optional[str] = None
    timezone: str = "UTC"
    notification_preferences: Optional[Dict[str, Any]] = None
    created_at: datetime


class UpdateProfileRequest(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2)
    avatar_url: Optional[str] = None
    timezone: Optional[str] = None
    notification_preferences: Optional[Dict[str, Any]] = None


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)
