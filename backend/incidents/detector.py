import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession

from backend.agents.state import RCAAgentState
from backend.agents.workflow import rca_workflow
from backend.models.incidents import Incident, IncidentTimeline, RcaReport
from backend.models.projects import Service
from backend.repositories.incident_repository import IncidentRepository, RcaReportRepository
from backend.repositories.project_repository import ServiceRepository
from backend.utils.logging import logger


class IncidentDetector:
    """
    Autonomous Real-Time Incident Detection Engine.
    Evaluates streaming telemetry for exception spikes, latency anomalies, and service failures.
    Automatically launches LangGraph multi-agent AI RCA workflow.
    """

    async def evaluate_telemetry_batch(
        self,
        session: AsyncSession,
        project_id: uuid.UUID,
        service_name: str,
        environment: str,
        logs: List[Dict[str, Any]],
        exceptions: List[Dict[str, Any]],
        traces: List[Dict[str, Any]],
        metrics: List[Dict[str, Any]],
        deployments: List[Dict[str, Any]]
    ) -> Optional[Incident]:
        """Evaluates batch telemetry and triggers autonomous incident workflow if anomalies exceed rules."""
        service_repo = ServiceRepository(session)
        service = await service_repo.get_by_project_and_name(project_id, service_name)
        if not service:
            service = Service(
                project_id=project_id,
                name=service_name,
                type="backend",
                is_healthy=True
            )
            service = await service_repo.create(service)

        # Check existing active incident for this service
        incident_repo = IncidentRepository(session)
        active_incident = await incident_repo.get_active_incident_for_service(project_id, service.id)

        # Incident Rule 1: High Severity Exception Trigger
        error_logs = [l for l in logs if l.get("level") in ("ERROR", "CRITICAL")]
        unhandled_exceptions = [e for e in exceptions if not e.get("handled", False)]
        slow_traces = [t for t in traces if t.get("duration_ms", 0) > 3000.0 or t.get("status_code", 200) >= 500]

        is_anomaly = len(error_logs) >= 3 or len(unhandled_exceptions) > 0 or len(slow_traces) >= 2

        if not is_anomaly:
            return None

        # Determine Severity (P0, P1, P2, P3)
        severity = "P2"
        if len(unhandled_exceptions) >= 3 or len(slow_traces) >= 5:
            severity = "P0"
        elif len(error_logs) >= 5 or len(unhandled_exceptions) > 0:
            severity = "P1"

        top_error_msg = (
            unhandled_exceptions[0].get("message")
            if unhandled_exceptions
            else (error_logs[0].get("message") if error_logs else "Elevated operational latency and errors")
        )

        if active_incident:
            logger.info("Appending telemetry to existing active incident", incident_id=str(active_incident.id))
            return active_incident

        # Create New Autonomous Incident
        new_incident = Incident(
            project_id=project_id,
            service_id=service.id,
            title=f"{severity} Incident: {service_name} - {top_error_msg[:120]}",
            description=f"Automated detection triggered by {len(error_logs)} error logs and {len(unhandled_exceptions)} unhandled exceptions.",
            severity=severity,
            status="CREATED",
            started_at=datetime.now(timezone.utc)
        )
        new_incident = await incident_repo.create(new_incident)

        # Record Initial Timeline Event
        timeline_event = IncidentTimeline(
            incident_id=new_incident.id,
            event_type="TRIGGERED",
            message=f"Incident detected automatically via {severity} anomaly rules.",
            metadata_json={
                "error_log_count": len(error_logs),
                "unhandled_exception_count": len(unhandled_exceptions),
                "slow_trace_count": len(slow_traces)
            }
        )
        session.add(timeline_event)

        # Update service health
        service.is_healthy = False
        service.last_seen_at = datetime.now(timezone.utc)

        await session.flush()
        logger.info("Created new autonomous incident", incident_id=str(new_incident.id), severity=severity)

        # Trigger Autonomous LangGraph AI RCA Orchestration Workflow
        await self._trigger_ai_rca_workflow(
            session=session,
            incident=new_incident,
            service_name=service_name,
            logs=logs,
            exceptions=exceptions,
            traces=traces,
            metrics={"count": len(metrics)},
            deployments=deployments
        )

        return new_incident

    async def _trigger_ai_rca_workflow(
        self,
        session: AsyncSession,
        incident: Incident,
        service_name: str,
        logs: List[Dict[str, Any]],
        exceptions: List[Dict[str, Any]],
        traces: List[Dict[str, Any]],
        metrics: Dict[str, Any],
        deployments: List[Dict[str, Any]]
    ) -> None:
        """Invokes LangGraph multi-agent workflow and persists generated RCA report into PostgreSQL."""
        try:
            incident.status = "AI_PROCESSING"
            await session.flush()

            initial_state = RCAAgentState(
                incident_id=str(incident.id),
                project_id=str(incident.project_id),
                service_id=str(incident.service_id),
                service_name=service_name,
                title=incident.title,
                severity=incident.severity,
                started_at=incident.started_at.isoformat(),
                logs=logs[:20],
                exceptions=exceptions[:10],
                traces=traces[:10],
                metrics=metrics,
                deployments=deployments[:5]
            )

            # Execute LangGraph Multi-Agent Workflow
            final_state = rca_workflow.run_workflow(initial_state)

            if final_state.final_rca:
                rca_dict = final_state.final_rca

                # Persist RcaReport record
                rca_repo = RcaReportRepository(session)
                report_model = RcaReport(
                    incident_id=incident.id,
                    project_id=incident.project_id,
                    summary=rca_dict.get("summary", "Summary unavailable."),
                    root_cause=rca_dict.get("root_cause", "Root cause under investigation."),
                    timeline_json=rca_dict.get("timeline", []),
                    evidence_json=rca_dict.get("evidence", {}),
                    historical_matches_json=rca_dict.get("historical_matches", []),
                    fix_recommendations_json=rca_dict.get("fix_recommendations", []),
                    prevention_actions_json=rca_dict.get("prevention_actions", []),
                    confidence_score=float(rca_dict.get("confidence_score", 0.85)),
                    confidence_level=final_state.confidence_meta.get("confidence_level", "HIGH"),
                    reasoning_tree_json={"executed_agents": final_state.executed_agents}
                )
                await rca_repo.create(report_model)

                # Update Incident status
                incident.status = "INVESTIGATING"
                incident.root_cause_summary = report_model.root_cause
                incident.confidence_score = report_model.confidence_score

                # Add Timeline record for AI RCA completion
                ai_timeline = IncidentTimeline(
                    incident_id=incident.id,
                    event_type="RCA_GENERATED",
                    message="Autonomous AI multi-agent workflow completed RCA generation.",
                    metadata_json={
                        "confidence_score": report_model.confidence_score,
                        "executed_agents": final_state.executed_agents
                    }
                )
                session.add(ai_timeline)
                await session.flush()
                logger.info("Successfully completed AI RCA workflow for incident", incident_id=str(incident.id))
        except Exception as exc:
            logger.error("AI RCA Workflow failed for incident", incident_id=str(incident.id), error=str(exc))
            incident.status = "INVESTIGATING"


incident_detector = IncidentDetector()
