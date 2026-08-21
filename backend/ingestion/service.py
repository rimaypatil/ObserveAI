import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List
from sqlalchemy.ext.asyncio import AsyncSession

from backend.incidents.detector import incident_detector
from backend.models.projects import Deployment, Service
from backend.models.telemetry import TelemetryException, TelemetryLog, TelemetryMetric, TelemetryTrace
from backend.repositories.project_repository import DeploymentRepository, ServiceRepository
from backend.repositories.telemetry_repository import (
    TelemetryExceptionRepository,
    TelemetryLogRepository,
    TelemetryMetricRepository,
    TelemetryTraceRepository,
)
from backend.utils.logging import logger


class IngestionService:
    """High-Throughput Telemetry Ingestion Service."""

    async def process_telemetry_batch(
        self,
        session: AsyncSession,
        project_id: uuid.UUID,
        payload: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Bulk inserts telemetry into PostgreSQL and evaluates incident triggers."""
        service_name = payload.get("service_name", "default-service")
        environment = payload.get("environment", "production")

        # Get or create microservice entity
        service_repo = ServiceRepository(session)
        service = await service_repo.get_by_project_and_name(project_id, service_name)
        if not service:
            service = Service(
                project_id=project_id,
                name=service_name,
                type="backend",
                is_healthy=True,
                last_seen_at=datetime.now(timezone.utc)
            )
            service = await service_repo.create(service)
        else:
            service.last_seen_at = datetime.now(timezone.utc)

        service_id = service.id

        # 1. Bulk Logs
        raw_logs = payload.get("logs", [])
        log_models = []
        for l in raw_logs:
            ts_raw = l.get("timestamp")
            ts = datetime.fromisoformat(ts_raw) if ts_raw else datetime.now(timezone.utc)
            log_models.append(TelemetryLog(
                project_id=project_id,
                service_id=service_id,
                timestamp=ts,
                level=l.get("level", "INFO").upper(),
                message=l.get("message", ""),
                logger_name=l.get("logger_name"),
                trace_id=l.get("trace_id"),
                span_id=l.get("span_id"),
                attributes=l.get("attributes", {})
            ))
        if log_models:
            log_repo = TelemetryLogRepository(session)
            await log_repo.create_many(log_models)

        # 2. Bulk Exceptions
        raw_exceptions = payload.get("exceptions", [])
        exc_models = []
        for e in raw_exceptions:
            ts_raw = e.get("timestamp")
            ts = datetime.fromisoformat(ts_raw) if ts_raw else datetime.now(timezone.utc)
            exc_models.append(TelemetryException(
                project_id=project_id,
                service_id=service_id,
                timestamp=ts,
                exception_type=e.get("exception_type", "RuntimeError"),
                message=e.get("message", ""),
                stacktrace=e.get("stacktrace", ""),
                file_name=e.get("file_name"),
                line_number=e.get("line_number"),
                function_name=e.get("function_name"),
                handled=e.get("handled", False),
                trace_id=e.get("trace_id")
            ))
        if exc_models:
            exc_repo = TelemetryExceptionRepository(session)
            await exc_repo.create_many(exc_models)

        # 3. Bulk Traces
        raw_traces = payload.get("traces", [])
        trace_models = []
        for t in raw_traces:
            ts_raw = t.get("timestamp")
            ts = datetime.fromisoformat(ts_raw) if ts_raw else datetime.now(timezone.utc)
            trace_models.append(TelemetryTrace(
                project_id=project_id,
                service_id=service_id,
                timestamp=ts,
                trace_id=t.get("trace_id", uuid.uuid4().hex),
                span_id=t.get("span_id", uuid.uuid4().hex[:16]),
                parent_span_id=t.get("parent_span_id"),
                operation_name=t.get("operation_name", "http_request"),
                duration_ms=float(t.get("duration_ms", 0.0)),
                status_code=int(t.get("status_code", 200)),
                attributes=t.get("attributes", {})
            ))
        if trace_models:
            trace_repo = TelemetryTraceRepository(session)
            await trace_repo.create_many(trace_models)

        # 4. Bulk Metrics
        raw_metrics = payload.get("metrics", [])
        metric_models = []
        for m in raw_metrics:
            ts_raw = m.get("timestamp")
            ts = datetime.fromisoformat(ts_raw) if ts_raw else datetime.now(timezone.utc)
            metric_models.append(TelemetryMetric(
                project_id=project_id,
                service_id=service_id,
                timestamp=ts,
                name=m.get("name", "custom_metric"),
                metric_type=m.get("metric_type", "gauge"),
                value=float(m.get("value", 0.0)),
                unit=m.get("unit"),
                tags=m.get("tags", {})
            ))
        if metric_models:
            metric_repo = TelemetryMetricRepository(session)
            await metric_repo.create_many(metric_models)

        # 5. Deployments
        raw_deployments = payload.get("deployments", [])
        for d in raw_deployments:
            deploy_repo = DeploymentRepository(session)
            deploy_model = Deployment(
                project_id=project_id,
                service_id=service_id,
                version=d.get("version", "v1.0.0"),
                commit_hash=d.get("commit_hash"),
                commit_message=d.get("commit_message"),
                author=d.get("author"),
                status=d.get("status", "deployed")
            )
            await deploy_repo.create(deploy_model)

        await session.flush()

        # Run Incident Detector Evaluation
        incident = await incident_detector.evaluate_telemetry_batch(
            session=session,
            project_id=project_id,
            service_name=service_name,
            environment=environment,
            logs=raw_logs,
            exceptions=raw_exceptions,
            traces=raw_traces,
            metrics=raw_metrics,
            deployments=raw_deployments
        )

        await session.commit()

        return {
            "status": "success",
            "processed": {
                "logs": len(log_models),
                "exceptions": len(exc_models),
                "traces": len(trace_models),
                "metrics": len(metric_models),
                "deployments": len(raw_deployments)
            },
            "incident_triggered": incident is not None,
            "incident_id": str(incident.id) if incident else None
        }


ingestion_service = IngestionService()
