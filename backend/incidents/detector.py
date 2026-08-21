import re
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


def normalize_route(route: str) -> str:
    """Normalizes dynamic parts of route endpoints, e.g. /users/123 -> /users/{id}."""
    if not route:
        return "unknown_endpoint"
    # Replace UUIDs
    route = re.sub(r"[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}", "{uuid}", route)
    # Replace numeric IDs
    route = re.sub(r"/\d+(?=/|$)", "/{id}", route)
    return route.strip()


def extract_endpoint(
    logs: List[Dict[str, Any]],
    exceptions: List[Dict[str, Any]],
    traces: List[Dict[str, Any]]
) -> str:
    """Extracts endpoint/route from traces, exceptions, or log messages."""
    # 1. Traces
    for t in traces:
        op = t.get("operation_name") or t.get("endpoint") or ""
        attrs = t.get("attributes") or {}
        target = attrs.get("http.target") or attrs.get("http.route") or attrs.get("url.path") or attrs.get("endpoint") or ""
        candidate = target or op
        if candidate and candidate not in ("http_request", "http", "request"):
            return normalize_route(candidate)

    # 2. Exceptions
    for e in exceptions:
        attrs = e.get("attributes") or {}
        target = attrs.get("endpoint") or attrs.get("path") or ""
        if target:
            return normalize_route(target)

    # 3. Logs
    for l in logs:
        msg = l.get("message") or ""
        match = re.search(r"(GET|POST|PUT|DELETE|PATCH|OPTIONS|HEAD)\s+([^\s\?]+)", msg)
        if match:
            method, path = match.group(1), match.group(2)
            return normalize_route(f"{method} {path}")
        
    return "unknown_endpoint"


def compute_fingerprint(
    service_name: str,
    logs: List[Dict[str, Any]],
    exceptions: List[Dict[str, Any]],
    traces: List[Dict[str, Any]]
) -> str:
    """
    Computes a deterministic, stable fingerprint for a failure event batch.
    Uses service_name, normalized route, exception type, error message pattern, and HTTP status code.
    Excludes dynamic timestamps, trace IDs, span IDs, or random hashes.
    """
    parts = [service_name]

    endpoint = extract_endpoint(logs, exceptions, traces)
    parts.append(f"EP:{endpoint}")

    # Exception classification
    if exceptions:
        exc = exceptions[0]
        exc_type = exc.get("exception_type", "Exception")
        exc_msg = (exc.get("message") or "").strip()
        exc_msg_clean = re.sub(r"0x[0-9a-fA-F]+", "", exc_msg)
        exc_msg_clean = re.sub(r"[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}", "", exc_msg_clean).strip()[:60]
        parts.append(f"EXC:{exc_type}:{exc_msg_clean}")

    # Trace HTTP status classification
    error_traces = [t for t in traces if t.get("status_code", 200) >= 400 or t.get("duration_ms", 0) > 3000.0]
    if error_traces:
        t = error_traces[0]
        status = t.get("status_code", 200)
        if status >= 400:
            parts.append(f"HTTP_{status}")
        else:
            parts.append("SLOW")

    # Log classification (if no exception or trace)
    error_logs = [l for l in logs if l.get("level") in ("ERROR", "CRITICAL")]
    if error_logs and not exceptions and not error_traces:
        log_msg = (error_logs[0].get("message") or "").strip()
        log_msg_clean = re.sub(r"0x[0-9a-fA-F]+", "", log_msg)
        log_msg_clean = re.sub(r"[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}", "", log_msg_clean).strip()[:60]
        parts.append(f"LOG:{log_msg_clean}")

    if len(parts) == 1:
        parts.append("UNKNOWN_ANOMALY")

    return "|".join(parts)


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

        # Evaluate anomaly triggers across logs, exceptions (both handled & unhandled), and error/slow traces
        error_logs = [l for l in logs if l.get("level") in ("ERROR", "CRITICAL")]
        all_exceptions = exceptions
        unhandled_exceptions = [e for e in exceptions if not e.get("handled", False)]
        error_traces = [t for t in traces if t.get("status_code", 200) >= 400 or t.get("duration_ms", 0) > 3000.0]

        is_anomaly = len(error_logs) > 0 or len(all_exceptions) > 0 or len(error_traces) > 0

        if not is_anomaly:
            return None

        # Compute stable fingerprint for failure deduplication
        fingerprint = compute_fingerprint(service_name, logs, exceptions, traces)

        # Check active incidents for this service matching the fingerprint
        incident_repo = IncidentRepository(session)
        matching_active_incident = await incident_repo.get_active_incident_by_fingerprint(
            project_id=project_id,
            service_id=service.id,
            fingerprint=fingerprint
        )

        if not matching_active_incident:
            active_incidents = await incident_repo.get_active_incidents_for_service(project_id, service.id)
            for inc in active_incidents:
                if inc.fingerprint == fingerprint:
                    matching_active_incident = inc
                    break
                for te in inc.timeline_events:
                    if te.metadata_json and te.metadata_json.get("fingerprint") == fingerprint:
                        matching_active_incident = inc
                        break
                if matching_active_incident:
                    break

        if matching_active_incident:
            logger.info(
                "Appending telemetry batch to active incident matching fingerprint",
                incident_id=str(matching_active_incident.id),
                fingerprint=fingerprint
            )
            append_timeline = IncidentTimeline(
                incident_id=matching_active_incident.id,
                event_type="TELEMETRY_APPENDED",
                message=f"Recurrent failure anomaly appended matching fingerprint '{fingerprint}'.",
                metadata_json={
                    "fingerprint": fingerprint,
                    "error_log_count": len(error_logs),
                    "exception_count": len(all_exceptions),
                    "error_trace_count": len(error_traces)
                }
            )
            session.add(append_timeline)
            await session.flush()
            return matching_active_incident

        # Determine Severity (P0, P1, P2)
        severity = "P2"
        if len(all_exceptions) >= 3 or len(error_traces) >= 5 or any(t.get("status_code", 200) >= 500 for t in error_traces):
            if any(t.get("status_code", 200) >= 500 and t.get("duration_ms", 0) > 3000.0 for t in error_traces) or len(all_exceptions) >= 3:
                severity = "P0"
            else:
                severity = "P1"
        elif len(error_logs) >= 3 or len(all_exceptions) > 0 or len(error_traces) > 0:
            severity = "P1"

        top_error_msg = (
            all_exceptions[0].get("message")
            if all_exceptions
            else (
                error_logs[0].get("message")
                if error_logs
                else (
                    error_traces[0].get("operation_name", "Elevated operational latency and errors")
                    if error_traces
                    else "Elevated operational latency and errors"
                )
            )
        )

        # Create New Autonomous Incident
        new_incident = Incident(
            project_id=project_id,
            service_id=service.id,
            title=f"{severity} Incident: {service_name} - {top_error_msg[:120]}",
            description=f"Automated detection triggered by {len(error_logs)} error logs, {len(all_exceptions)} exceptions, and {len(error_traces)} error/slow traces.",
            severity=severity,
            status="CREATED",
            fingerprint=fingerprint,
            started_at=datetime.now(timezone.utc)
        )
        new_incident = await incident_repo.create(new_incident)

        # Record Initial Timeline Event with Fingerprint
        timeline_event = IncidentTimeline(
            incident_id=new_incident.id,
            event_type="TRIGGERED",
            message=f"Incident detected automatically via {severity} anomaly rules.",
            metadata_json={
                "fingerprint": fingerprint,
                "error_log_count": len(error_logs),
                "exception_count": len(all_exceptions),
                "unhandled_exception_count": len(unhandled_exceptions),
                "error_trace_count": len(error_traces)
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

            from backend.repositories.project_repository import ProjectRepository
            project_repo = ProjectRepository(session)
            project = await project_repo.get_by_id(incident.project_id)
            org_id_str = str(project.organization_id) if project else None

            initial_state = RCAAgentState(
                incident_id=str(incident.id),
                project_id=str(incident.project_id),
                organization_id=org_id_str,
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
                    reasoning_tree_json={
                        "executed_agents": final_state.executed_agents,
                        "planner_decisions": final_state.execution_plan,
                        "agent_reasoning": final_state.agent_reasoning,
                        "confidence_reasoning": final_state.confidence_analysis,
                        "historical_matches": final_state.rag_analysis.get("historical_matches", []),
                        "latency_analysis": final_state.trace_analysis,
                        "deployment_correlation": final_state.deployment_analysis,
                        "log_analysis": final_state.log_analysis,
                        "exception_analysis": final_state.exception_analysis,
                        "metric_analysis": final_state.metric_analysis
                    }
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
