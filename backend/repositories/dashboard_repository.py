import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional
from sqlalchemy import func, select
from backend.models.incidents import Incident, RcaReport
from backend.models.projects import Project, Service
from backend.models.telemetry import TelemetryException, TelemetryLog, TelemetryMetric, TelemetryTrace


class DashboardRepository:
    def __init__(self, session):
        self.session = session

    async def get_overview_stats(self, organization_id: Optional[uuid.UUID] = None) -> Dict[str, Any]:
        now = datetime.now(timezone.utc)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

        # Total projects for organization
        p_stmt = select(Project.id).where(Project.is_deleted == False)
        if organization_id:
            p_stmt = p_stmt.where(Project.organization_id == organization_id)
        
        project_ids_res = await self.session.execute(p_stmt)
        project_ids = project_ids_res.scalars().all()
        project_count = len(project_ids)

        # If user has zero projects or no organization projects match, return zeroed stats
        if project_count == 0 or (organization_id and not project_ids):
            return {
                "project_count": 0,
                "incident_count": 0,
                "critical_incidents": 0,
                "logs_today": 0,
                "metrics_today": 0,
                "traces_today": 0,
                "rca_generated": 0,
                "avg_resolution_time_minutes": 0.0,
            }

        # Total incidents
        inc_stmt = select(func.count(Incident.id)).where(
            Incident.is_deleted == False,
            Incident.project_id.in_(project_ids)
        )
        inc_count = (await self.session.execute(inc_stmt)).scalar() or 0

        # Critical incidents
        crit_stmt = select(func.count(Incident.id)).where(
            Incident.is_deleted == False,
            Incident.project_id.in_(project_ids),
            Incident.severity.in_(["P0", "P1", "CRITICAL", "HIGH"])
        )
        critical_count = (await self.session.execute(crit_stmt)).scalar() or 0

        # Telemetry today
        log_stmt = select(func.count(TelemetryLog.id)).where(
            TelemetryLog.timestamp >= today_start,
            TelemetryLog.project_id.in_(project_ids)
        )
        logs_today = (await self.session.execute(log_stmt)).scalar() or 0

        metric_stmt = select(func.count(TelemetryMetric.id)).where(
            TelemetryMetric.timestamp >= today_start,
            TelemetryMetric.project_id.in_(project_ids)
        )
        metrics_today = (await self.session.execute(metric_stmt)).scalar() or 0

        trace_stmt = select(func.count(TelemetryTrace.id)).where(
            TelemetryTrace.timestamp >= today_start,
            TelemetryTrace.project_id.in_(project_ids)
        )
        traces_today = (await self.session.execute(trace_stmt)).scalar() or 0

        rca_stmt = select(func.count(RcaReport.id)).where(
            RcaReport.is_deleted == False,
            RcaReport.project_id.in_(project_ids)
        )
        rca_count = (await self.session.execute(rca_stmt)).scalar() or 0

        # Mean Time To Resolution (MTTR) in minutes
        resolved_incidents_stmt = select(Incident).where(
            Incident.is_deleted == False,
            Incident.project_id.in_(project_ids),
            Incident.status == "RESOLVED",
            Incident.resolved_at.isnot(None)
        )
        resolved_incidents = (await self.session.execute(resolved_incidents_stmt)).scalars().all()
        
        total_resolution_seconds = 0.0
        for inc in resolved_incidents:
            if inc.resolved_at and inc.started_at:
                diff = (inc.resolved_at - inc.started_at).total_seconds()
                total_resolution_seconds += max(diff, 0.0)
        
        avg_resolution_min = (total_resolution_seconds / 60.0 / len(resolved_incidents)) if resolved_incidents else 0.0

        return {
            "project_count": project_count,
            "incident_count": inc_count,
            "critical_incidents": critical_count,
            "logs_today": logs_today,
            "metrics_today": metrics_today,
            "traces_today": traces_today,
            "rca_generated": rca_count,
            "avg_resolution_time_minutes": round(avg_resolution_min, 2),
        }
