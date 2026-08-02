import uuid
from typing import Optional, Sequence
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from backend.models.incidents import Incident, IncidentTimeline, RcaReport
from backend.repositories.base import BaseRepository


class IncidentRepository(BaseRepository[Incident]):
    def __init__(self, session):
        super().__init__(Incident, session)

    async def get_with_details(self, incident_id: uuid.UUID) -> Optional[Incident]:
        query = (
            select(Incident)
            .options(
                selectinload(Incident.timeline_events),
                selectinload(Incident.rca_report),
                selectinload(Incident.service),
                selectinload(Incident.project)
            )
            .where(Incident.id == incident_id, Incident.is_deleted == False)
        )
        result = await self.session.execute(query)
        return result.scalars().first()

    async def list_by_project(
        self,
        project_id: uuid.UUID,
        status: Optional[str] = None,
        severity: Optional[str] = None,
        service_id: Optional[uuid.UUID] = None,
        limit: int = 50,
        offset: int = 0
    ) -> Sequence[Incident]:
        query = (
            select(Incident)
            .options(selectinload(Incident.service))
            .where(Incident.project_id == project_id, Incident.is_deleted == False)
        )
        if status:
            query = query.where(Incident.status == status)
        if severity:
            query = query.where(Incident.severity == severity)
        if service_id:
            query = query.where(Incident.service_id == service_id)

        query = query.order_by(Incident.started_at.desc()).offset(offset).limit(limit)
        result = await self.session.execute(query)
        return result.scalars().all()

    async def get_active_incident_for_service(
        self,
        project_id: uuid.UUID,
        service_id: uuid.UUID
    ) -> Optional[Incident]:
        query = select(Incident).where(
            Incident.project_id == project_id,
            Incident.service_id == service_id,
            Incident.status.in_(["CREATED", "INVESTIGATING", "AI_PROCESSING"]),
            Incident.is_deleted == False
        ).order_by(Incident.started_at.desc()).limit(1)

        result = await self.session.execute(query)
        return result.scalars().first()


class RcaReportRepository(BaseRepository[RcaReport]):
    def __init__(self, session):
        super().__init__(RcaReport, session)

    async def get_by_incident_id(self, incident_id: uuid.UUID) -> Optional[RcaReport]:
        query = select(RcaReport).where(
            RcaReport.incident_id == incident_id,
            RcaReport.is_deleted == False
        )
        result = await self.session.execute(query)
        return result.scalars().first()
