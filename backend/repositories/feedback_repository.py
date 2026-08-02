import uuid
from typing import Optional, Sequence
from sqlalchemy import select
from backend.models.feedback import RCAFeedback
from backend.repositories.base import BaseRepository


class FeedbackRepository(BaseRepository[RCAFeedback]):
    def __init__(self, session):
        super().__init__(RCAFeedback, session)

    async def get_by_incident(self, incident_id: uuid.UUID) -> Sequence[RCAFeedback]:
        query = select(RCAFeedback).where(RCAFeedback.incident_id == incident_id, RCAFeedback.is_deleted == False)
        result = await self.session.execute(query)
        return result.scalars().all()
