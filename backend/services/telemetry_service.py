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


from sqlalchemy import func, select
from backend.models.projects import Service


class TelemetryService:
    async def query_logs(
        self,
        session: AsyncSession,
        project_id: uuid.UUID,
        organization_id: uuid.UUID,
        service_id: Optional[uuid.UUID] = None,
        level: Optional[str] = None,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        trace_id: Optional[str] = None,
        search_term: Optional[str] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[TelemetryLog]:
        from backend.api.dependencies import verify_project_ownership
        await verify_project_ownership(session, project_id, organization_id)
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
        organization_id: uuid.UUID,
        trace_id: str
    ) -> List[TelemetryTrace]:
        from backend.api.dependencies import verify_project_ownership
        await verify_project_ownership(session, project_id, organization_id)
        trace_repo = TelemetryTraceRepository(session)
        return list(await trace_repo.get_by_trace_id(project_id, trace_id))

    async def query_exceptions(
        self,
        session: AsyncSession,
        project_id: uuid.UUID,
        organization_id: uuid.UUID,
        service_id: Optional[uuid.UUID] = None,
        exception_type: Optional[str] = None,
        limit: int = 50
    ) -> List[TelemetryException]:
        from backend.api.dependencies import verify_project_ownership
        await verify_project_ownership(session, project_id, organization_id)
        exc_repo = TelemetryExceptionRepository(session)
        return list(await exc_repo.query_exceptions(
            project_id=project_id,
            service_id=service_id,
            exception_type=exception_type,
            limit=limit
        ))

    async def get_telemetry_summary(
        self,
        session: AsyncSession,
        project_id: uuid.UUID,
        organization_id: uuid.UUID
    ) -> dict:
        from backend.api.dependencies import verify_project_ownership
        await verify_project_ownership(session, project_id, organization_id)

        log_count = (await session.execute(
            select(func.count(TelemetryLog.id)).where(TelemetryLog.project_id == project_id, TelemetryLog.is_deleted == False)
        )).scalar() or 0

        metric_count = (await session.execute(
            select(func.count(TelemetryMetric.id)).where(TelemetryMetric.project_id == project_id, TelemetryMetric.is_deleted == False)
        )).scalar() or 0

        trace_count = (await session.execute(
            select(func.count(TelemetryTrace.id)).where(TelemetryTrace.project_id == project_id, TelemetryTrace.is_deleted == False)
        )).scalar() or 0

        error_logs = (await session.execute(
            select(func.count(TelemetryLog.id)).where(
                TelemetryLog.project_id == project_id,
                TelemetryLog.level.in_(["ERROR", "CRITICAL"]),
                TelemetryLog.is_deleted == False
            )
        )).scalar() or 0

        error_rate = round((error_logs / log_count * 100.0), 2) if log_count > 0 else 0.0

        return {
            "logs_count": log_count,
            "metrics_count": metric_count,
            "traces_count": trace_count,
            "error_rate_percentage": error_rate
        }

    async def get_top_errors(
        self,
        session: AsyncSession,
        project_id: uuid.UUID,
        organization_id: uuid.UUID
    ) -> List[dict]:
        from backend.api.dependencies import verify_project_ownership
        await verify_project_ownership(session, project_id, organization_id)

        stmt = (
            select(TelemetryLog.message, func.count(TelemetryLog.id).label("count"), Service.name)
            .join(Service, TelemetryLog.service_id == Service.id)
            .where(
                TelemetryLog.project_id == project_id,
                TelemetryLog.level.in_(["ERROR", "CRITICAL"]),
                TelemetryLog.is_deleted == False
            )
            .group_by(TelemetryLog.message, Service.name)
            .order_by(func.count(TelemetryLog.id).desc())
            .limit(5)
        )
        rows = (await session.execute(stmt)).all()
        return [{"error_message": r[0], "count": r[1], "service": r[2]} for r in rows]

    async def get_top_services(
        self,
        session: AsyncSession,
        project_id: uuid.UUID,
        organization_id: uuid.UUID
    ) -> List[dict]:
        from backend.api.dependencies import verify_project_ownership
        await verify_project_ownership(session, project_id, organization_id)

        stmt = (
            select(Service.name, func.count(TelemetryLog.id).label("log_volume"), Service.is_healthy)
            .join(TelemetryLog, Service.id == TelemetryLog.service_id, isouter=True)
            .where(
                Service.project_id == project_id,
                Service.is_deleted == False
            )
            .group_by(Service.id, Service.name, Service.is_healthy)
            .order_by(func.count(TelemetryLog.id).desc())
            .limit(5)
        )
        rows = (await session.execute(stmt)).all()
        return [{"service_name": r[0], "log_volume": r[1], "status": "healthy" if r[2] else "degraded"} for r in rows]

    async def get_latency_stats(
        self,
        session: AsyncSession,
        project_id: uuid.UUID,
        organization_id: uuid.UUID
    ) -> dict:
        from backend.api.dependencies import verify_project_ownership
        await verify_project_ownership(session, project_id, organization_id)

        stmt = (
            select(TelemetryTrace.duration_ms)
            .where(TelemetryTrace.project_id == project_id, TelemetryTrace.is_deleted == False)
            .order_by(TelemetryTrace.duration_ms.asc())
        )
        durations = (await session.execute(stmt)).scalars().all()
        if not durations:
            return {"p50_ms": 0.0, "p95_ms": 0.0, "p99_ms": 0.0}

        n = len(durations)
        p50 = round(float(durations[int(n * 0.50)]), 2)
        p95 = round(float(durations[min(int(n * 0.95), n - 1)]), 2)
        p99 = round(float(durations[min(int(n * 0.99), n - 1)]), 2)
        return {"p50_ms": p50, "p95_ms": p95, "p99_ms": p99}


telemetry_service = TelemetryService()
