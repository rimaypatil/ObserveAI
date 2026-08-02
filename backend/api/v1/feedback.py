import uuid
from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from backend.api.dependencies import get_current_user
from backend.database.session import get_async_session
from backend.models.users import User
from backend.schemas.common import APIResponse
from backend.schemas.feedback import RCAFeedbackCreate, RCAFeedbackResponse
from backend.services.feedback_service import feedback_service

router = APIRouter(prefix="/incidents", tags=["AI RCA Feedback"])


@router.post("/{incident_id}/feedback", response_model=APIResponse[RCAFeedbackResponse], status_code=status.HTTP_201_CREATED)
async def create_rca_feedback(
    incident_id: uuid.UUID,
    data: RCAFeedbackCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session)
):
    """Submits user feedback and accuracy rating for an AI-generated RCA report."""
    feedback = await feedback_service.create_feedback(session, incident_id, current_user.id, data)
    return APIResponse(
        message="RCA feedback submitted successfully.",
        data=RCAFeedbackResponse.model_validate(feedback)
    )


@router.get("/{incident_id}/feedback", response_model=APIResponse[List[RCAFeedbackResponse]])
async def get_rca_feedback(
    incident_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session)
):
    """Retrieves feedback ratings submitted for an incident's RCA report."""
    feedbacks = await feedback_service.get_incident_feedback(session, incident_id)
    return APIResponse(
        message="RCA feedback retrieved.",
        data=[RCAFeedbackResponse.model_validate(f) for f in feedbacks]
    )
