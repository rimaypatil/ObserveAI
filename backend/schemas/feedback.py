import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class RCAFeedbackCreate(BaseModel):
    is_helpful: bool
    rating: Optional[int] = Field(None, ge=1, le=5)
    comment: Optional[str] = None


class RCAFeedbackResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    incident_id: uuid.UUID
    rca_report_id: Optional[uuid.UUID] = None
    user_id: uuid.UUID
    is_helpful: bool
    rating: Optional[int] = None
    comment: Optional[str] = None
    created_at: datetime
