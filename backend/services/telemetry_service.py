import uuid
from datetime import datetime
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from backend.models.telemetry import TelemetryException, TelemetryLog, TelemetryMetric, TelemetryTrace
from backend.repositories.telemetry_repository import (
    TelemetryExceptionRepository,
    TelemetryLogRepository,
    TelemetryMetricRepository,
    TelemetryTraceRepository,
)


class TelemetryService:
    async def query_logs(
        self,
        session: AsyncSession,
        project_id: uuid.UUID,
        service_id: Optional[uuid.UUID] = None,
        level: Optional[str] = None,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        trace_id: Optional[str] = None,
        search_term: Optional[str] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[TelemetryLog]:
        log_repo = TelemetryLogRepository(session)
        return list(await log_repo.query_logs(
            project_id=project_id,
            service_id=service_id,
            level=level,
            start_time=start_time,
            end_time=end_time,
            trace_id=trace_id,
            search_term=search_term,
            limit=limit,
            offset=offset
        ))

    async def get_trace_waterfall(
        self,
        session: AsyncSession,
        project_id: uuid.UUID,
        trace_id: str
    ) -> List[TelemetryTrace]:
        trace_repo = TelemetryTraceRepository(session)
        return list(await trace_repo.get_by_trace_id(project_id, trace_id))

    async def query_exceptions(
        self,
        session: AsyncSession,
        project_id: uuid.UUID,
        service_id: Optional[uuid.UUID] = None,
        exception_type: Optional[str] = None,
        limit: int = 50
    ) -> List[TelemetryException]:
        exc_repo = TelemetryExceptionRepository(session)
        return list(await exc_repo.query_exceptions(
            project_id=project_id,
            service_id=service_id,
            exception_type=exception_type,
            limit=limit
        ))


telemetry_service = TelemetryService()
