import uuid
from typing import Optional, Sequence
from sqlalchemy.ext.asyncio import AsyncSession
from backend.models.feedback import RCAFeedback
from backend.repositories.feedback_repository import FeedbackRepository
from backend.schemas.feedback import RCAFeedbackCreate


class FeedbackService:
    async def create_feedback(
        self,
        session: AsyncSession,
        incident_id: uuid.UUID,
        user_id: uuid.UUID,
        data: RCAFeedbackCreate,
        rca_report_id: Optional[uuid.UUID] = None
    ) -> RCAFeedback:
        repo = FeedbackRepository(session)
        feedback = RCAFeedback(
            incident_id=incident_id,
            rca_report_id=rca_report_id,
            user_id=user_id,
            is_helpful=data.is_helpful,
            rating=data.rating,
            comment=data.comment
        )
        return await repo.create(feedback)

    async def get_incident_feedback(
        self,
        session: AsyncSession,
        incident_id: uuid.UUID
    ) -> Sequence[RCAFeedback]:
        repo = FeedbackRepository(session)
        return await repo.get_by_incident(incident_id)


feedback_service = FeedbackService()
