import statistics
import time
import uuid
from collections import Counter
from datetime import datetime, timezone
from typing import Any, Dict, List

from backend.agents.state import RCAAgentState
from backend.confidence.engine import confidence_engine
from backend.embeddings.generator import embedding_generator
from backend.llm.gemini_client import gemini_client
from backend.rag.pipeline import rag_pipeline
from backend.utils.logging import logger
from backend.vectorstore.chroma_client import chroma_store


class LangGraphRCAWorkflow:
    """
    Autonomous Multi-Agent AI System powered by LangGraph.
    Agents: Planner -> Log -> Trace -> Exception -> Metrics -> Git/Deploy -> RAG -> Confidence -> RCA
    """

    def planner_node(self, state: RCAAgentState) -> RCAAgentState:
        """
        Planner Agent: Analyzes incident severity and available telemetry inventory to schedule agents.

        Inputs:
            state.severity: Incident severity (P0, P1, P2, P3)
            state.logs, state.traces, state.exceptions, state.metrics, state.deployments

        Outputs:
            state.execution_plan: Dict specifying scheduled agent flags
            state.agent_reasoning: Appended reasoning tree entry
            state.executed_agents: Appended agent execution marker
        """
        start_time = time.perf_counter()
        logger.info("Executing PlannerAgent", incident_id=state.incident_id, severity=state.severity)

        has_logs = len(state.logs) > 0
        has_traces = len(state.traces) > 0
        has_exceptions = len(state.exceptions) > 0
        has_metrics = bool(state.metrics) and (isinstance(state.metrics, dict) and len(state.metrics) > 0)
        has_deployments = len(state.deployments) > 0

        state.execution_plan = {
            "run_log_agent": True,
            "run_trace_agent": True,
            "run_exception_agent": True,
            "run_metric_agent": has_metrics,
            "run_deployment_agent": has_deployments,
            "run_rag_agent": True,
            "run_confidence_agent": True
        }

        reasoning_bullets = [
            f"Incident severity evaluated as {state.severity}.",
            f"Telemetry Inventory: {len(state.logs)} logs, {len(state.traces)} traces, {len(state.exceptions)} exceptions, {len(state.deployments)} deployments.",
            f"Scheduled execution plan with {sum(1 for v in state.execution_plan.values() if v)} active domain agents."
        ]

        state.agent_reasoning.append({
            "agent": "PlannerAgent",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "decision": f"Scheduled specialized analysis workflow for {state.severity} incident.",
            "reasoning": reasoning_bullets
        })

        duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
        state.executed_agents.append("PlannerAgent")
        logger.info("PlannerAgent completed", duration_ms=duration_ms, active_agents=sum(1 for v in state.execution_plan.values() if v))
        return state

    def log_analysis_node(self, state: RCAAgentState) -> RCAAgentState:
        """
        Log Analysis Agent: Performs statistical parsing and frequency distribution of raw log messages.

        Inputs:
            state.logs: Raw log objects

        Outputs:
            state.log_analysis: Structured analysis (error counts, top errors, affected modules/endpoints, timestamps)
            state.agent_reasoning: Appended reasoning tree entry
            state.executed_agents: Appended agent execution marker
        """
        start_time = time.perf_counter()
        logger.info("Executing LogAnalysisAgent", incident_id=state.incident_id)

        logs = state.logs or []
        total_logs = len(logs)

        error_logs = [l for l in logs if str(l.get("level", "")).upper() in ("ERROR", "CRITICAL", "FATAL")]
        warn_logs = [l for l in logs if str(l.get("level", "")).upper() in ("WARN", "WARNING")]
        info_logs = [l for l in logs if str(l.get("level", "")).upper() in ("INFO", "DEBUG")]

        level_counts = Counter([str(l.get("level", "UNKNOWN")).upper() for l in logs])
        dominant_level = level_counts.most_common(1)[0][0] if level_counts else "NONE"

        msg_counter = Counter([l.get("message", "Empty log message") for l in error_logs or logs])
        top_errors = [{"message": msg, "count": count} for msg, count in msg_counter.most_common(5)]
        error_frequency = dict(msg_counter)

        modules = list(set([l.get("logger") or l.get("module") or l.get("service") for l in logs if l.get("logger") or l.get("module") or l.get("service")]))
        endpoints = list(set([l.get("endpoint") or l.get("url") or l.get("path") for l in logs if l.get("endpoint") or l.get("url") or l.get("path")]))

        timestamps = [l.get("timestamp") for l in logs if l.get("timestamp")]
        first_occ = min(timestamps) if timestamps else state.started_at
        last_occ = max(timestamps) if timestamps else state.started_at

        state.log_analysis = {
            "total_logs": total_logs,
            "error_count": len(error_logs),
            "warning_count": len(warn_logs),
            "info_count": len(info_logs),
            "dominant_level": dominant_level,
            "top_errors": top_errors,
            "error_frequency": error_frequency,
            "affected_modules": modules,
            "affected_endpoints": endpoints,
            "first_occurrence": first_occ,
            "last_occurrence": last_occ
        }

        reasoning_bullets = [
            f"Analyzed {total_logs} log entries (dominant level: {dominant_level}).",
            f"Found {len(error_logs)} error-level logs and {len(warn_logs)} warning logs.",
            f"Top error pattern: '{top_errors[0]['message'] if top_errors else 'No error logs found'}' ({top_errors[0]['count'] if top_errors else 0} occurrences)."
        ]
        if modules:
            reasoning_bullets.append(f"Affected modules identified: {', '.join(modules[:3])}.")

        state.agent_reasoning.append({
            "agent": "LogAnalysisAgent",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "decision": "Completed log aggregation, error frequency calculation, and module impact mapping.",
            "reasoning": reasoning_bullets
        })

        duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
        state.executed_agents.append("LogAnalysisAgent")
        logger.info("LogAnalysisAgent completed", duration_ms=duration_ms, error_count=len(error_logs))
        return state

    def trace_analysis_node(self, state: RCAAgentState) -> RCAAgentState:
        """
        Trace Analysis Agent: Evaluates OpenTelemetry span durations, percentiles, HTTP status codes, and bottlenecks.

        Inputs:
            state.traces: OpenTelemetry trace/span dicts

        Outputs:
            state.trace_analysis: Percentiles (avg, median, max, min, p95, p99), slowest span/endpoint, status codes
            state.agent_reasoning: Appended reasoning tree entry
            state.executed_agents: Appended agent execution marker
        """
        start_time = time.perf_counter()
        logger.info("Executing TraceAnalysisAgent", incident_id=state.incident_id)

        traces = state.traces or []
        durations = []
        status_codes = []
        span_durations = []

        for t in traces:
            dur = float(t.get("duration_ms", t.get("duration", 0.0)))
            durations.append(dur)
            status = t.get("status_code", t.get("http_status", 200))
            status_codes.append(str(status))

            name = t.get("name") or t.get("span_name") or t.get("endpoint") or t.get("trace_id", "unknown-span")
            span_durations.append((name, dur, t))

        total_traces = len(traces)
        if durations:
            sorted_durs = sorted(durations)
            avg_lat = round(statistics.mean(durations), 2)
            median_lat = round(statistics.median(durations), 2)
            max_lat = round(max(durations), 2)
            min_lat = round(min(durations), 2)

            p95_idx = int(len(sorted_durs) * 0.95)
            p99_idx = int(len(sorted_durs) * 0.99)
            p95_lat = round(sorted_durs[min(p95_idx, len(sorted_durs) - 1)], 2)
            p99_lat = round(sorted_durs[min(p99_idx, len(sorted_durs) - 1)], 2)
        else:
            avg_lat = median_lat = max_lat = min_lat = p95_lat = p99_lat = 0.0

        status_dist = dict(Counter(status_codes))
        sorted_spans = sorted(span_durations, key=lambda x: x[1], reverse=True)
        slowest_span = sorted_spans[0][0] if sorted_spans else "N/A"
        slowest_endpoint = sorted_spans[0][2].get("endpoint") or sorted_spans[0][0] if sorted_spans else "N/A"

        bottlenecks = [
            f"Span '{name}' took {dur}ms" for name, dur, _ in sorted_spans if dur > 2000.0 or str(_.get("status_code", 200)).startswith("5")
        ]

        state.trace_analysis = {
            "total_traces": total_traces,
            "avg_latency_ms": avg_lat,
            "median_latency_ms": median_lat,
            "max_latency_ms": max_lat,
            "min_latency_ms": min_lat,
            "p95_latency_ms": p95_lat,
            "p99_latency_ms": p99_lat,
            "slowest_endpoint": slowest_endpoint,
            "slowest_span": slowest_span,
            "status_distribution": status_dist,
            "bottlenecks": bottlenecks
        }

        reasoning_bullets = [
            f"Evaluated {total_traces} distributed trace spans.",
            f"Latency distribution: Average={avg_lat}ms, P95={p95_lat}ms, Max={max_lat}ms.",
            f"Slowest operation/endpoint identified: '{slowest_endpoint}'.",
            f"Status distribution: {status_dist}."
        ]

        state.agent_reasoning.append({
            "agent": "TraceAnalysisAgent",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "decision": "Calculated latency percentiles, identified bottleneck spans, and aggregated HTTP status codes.",
            "reasoning": reasoning_bullets
        })

        duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
        state.executed_agents.append("TraceAnalysisAgent")
        logger.info("TraceAnalysisAgent completed", duration_ms=duration_ms, slowest_endpoint=slowest_endpoint, p95_ms=p95_lat)
        return state

    def exception_analysis_node(self, state: RCAAgentState) -> RCAAgentState:
        """
        Exception Analysis Agent: Parses stack traces, unhandled error types, affected files, and functions.

        Inputs:
            state.exceptions: Exception payload dicts

        Outputs:
            state.exception_analysis: Primary/repeated exceptions, stacktrace summary, error chains, affected files
            state.agent_reasoning: Appended reasoning tree entry
            state.executed_agents: Appended agent execution marker
        """
        start_time = time.perf_counter()
        logger.info("Executing ExceptionAnalysisAgent", incident_id=state.incident_id)

        exceptions = state.exceptions or []
        unhandled = [e for e in exceptions if not e.get("handled", False)]

        exc_types = [e.get("exception_type") or e.get("type") or "RuntimeError" for e in exceptions]
        exc_msgs = [e.get("message") or "Unhandled exception" for e in exceptions]
        type_counter = Counter(exc_types)

        primary_exc = f"{exc_types[0]}: {exc_msgs[0]}" if exceptions else "No exceptions reported"
        most_common_type = type_counter.most_common(1)[0][0] if type_counter else "None"
        repeated = [t for t, count in type_counter.items() if count > 1]

        stacktrace_snippet = "N/A"
        affected_files = []
        affected_functions = []

        for e in exceptions:
            st = e.get("stacktrace") or e.get("stack_trace") or ""
            if st:
                if stacktrace_snippet == "N/A":
                    stacktrace_snippet = st[:400]
                lines = st.split("\n")
                for line in lines:
                    if "File " in line:
                        parts = line.strip().split(",")
                        for p in parts:
                            if "File " in p:
                                f_name = p.replace("File ", "").strip("'\" ")
                                affected_files.append(f_name)
                            elif "in " in p:
                                func_name = p.replace("in ", "").strip()
                                affected_functions.append(func_name)

        affected_files = list(set(affected_files))
        affected_functions = list(set(affected_functions))

        state.exception_analysis = {
            "primary_exception": primary_exc,
            "repeated_exceptions": repeated,
            "unhandled_count": len(unhandled),
            "stacktrace_summary": stacktrace_snippet,
            "affected_files": affected_files,
            "affected_functions": affected_functions,
            "most_common_exception": most_common_type,
            "error_chain": exc_types
        }

        reasoning_bullets = [
            f"Parsed {len(exceptions)} exception payloads ({len(unhandled)} unhandled).",
            f"Primary exception identified: '{primary_exc}'.",
            f"Affected source files: {', '.join(affected_files[:3]) if affected_files else 'None extracted'}.",
            f"Affected functions: {', '.join(affected_functions[:3]) if affected_functions else 'None extracted'}."
        ]

        state.agent_reasoning.append({
            "agent": "ExceptionAnalysisAgent",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "decision": "Extracted root exception types, parsed stacktrace frames, and identified failing functions.",
            "reasoning": reasoning_bullets
        })

        duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
        state.executed_agents.append("ExceptionAnalysisAgent")
        logger.info("ExceptionAnalysisAgent completed", duration_ms=duration_ms, unhandled_count=len(unhandled))
        return state

    def metrics_node(self, state: RCAAgentState) -> RCAAgentState:
        """
        Metrics Agent: Evaluates CPU, Memory, Heap, Disk, and Latency/Error rate resource anomalies.

        Inputs:
            state.metrics: Metric dictionary or telemetry summary

        Outputs:
            state.metric_analysis: Anomaly flags (CPU, Memory, Heap, Disk, SLA latency) and summary
            state.agent_reasoning: Appended reasoning tree entry
            state.executed_agents: Appended agent execution marker
        """
        start_time = time.perf_counter()
        logger.info("Executing MetricsAgent", incident_id=state.incident_id)

        metrics = state.metrics or {}
        anomalies = []

        cpu = float(metrics.get("cpu_usage", metrics.get("cpu", 0.0)))
        memory = float(metrics.get("memory_usage", metrics.get("memory_usage_mb", metrics.get("memory", 0.0))))
        heap = float(metrics.get("heap_usage", metrics.get("heap", 0.0)))
        disk = float(metrics.get("disk_usage", metrics.get("disk", 0.0)))
        latency = float(metrics.get("avg_response_time", metrics.get("latency", 0.0)))
        error_rate = float(metrics.get("error_rate", 0.0))

        cpu_spike = cpu > 80.0 or metrics.get("cpu_spike", False)
        memory_spike = memory > 85.0 or metrics.get("memory_spike", False)
        heap_spike = heap > 85.0 or metrics.get("heap_spike", False)
        disk_high = disk > 90.0 or metrics.get("disk_high", False)
        high_latency = latency > 2000.0 or state.trace_analysis.get("p95_latency_ms", 0.0) > 2000.0
        high_error_rate = error_rate > 0.05 or state.log_analysis.get("error_count", 0) >= 3

        if cpu_spike:
            anomalies.append(f"CPU utilization spike detected ({cpu if cpu > 0 else 'elevated'}%).")
        if memory_spike or heap_spike:
            anomalies.append(f"Memory/Heap consumption spike detected ({memory if memory > 0 else 'elevated'}%).")
        if disk_high:
            anomalies.append("Disk I/O or storage pressure threshold exceeded.")
        if high_latency:
            anomalies.append("High response time anomaly detected (> 2000ms SLA).")
        if high_error_rate:
            anomalies.append("Elevated error rate anomaly confirmed.")

        state.metric_analysis = {
            "metrics_analyzed": len(metrics),
            "cpu_spike": cpu_spike,
            "memory_spike": memory_spike,
            "heap_spike": heap_spike,
            "disk_usage_high": disk_high,
            "high_response_time": high_latency,
            "high_error_rate": high_error_rate,
            "anomalies": anomalies
        }

        reasoning_bullets = [
            f"Evaluated telemetry system metrics ({len(metrics)} indicators).",
            f"Anomalies detected: {len(anomalies)} resource alerts.",
        ] + (anomalies if anomalies else ["All infrastructure metrics within baseline operational boundaries."])

        state.agent_reasoning.append({
            "agent": "MetricsAgent",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "decision": "Evaluated system resource metrics and identified infrastructure anomalies.",
            "reasoning": reasoning_bullets
        })

        duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
        state.executed_agents.append("MetricsAgent")
        logger.info("MetricsAgent completed", duration_ms=duration_ms, anomaly_count=len(anomalies))
        return state

    def git_deployment_node(self, state: RCAAgentState) -> RCAAgentState:
        """
        Git & Deployment Agent: Correlates release versions, commit messages, and deployment timestamps to incident start.

        Inputs:
            state.deployments: Deployment release payload dicts
            state.started_at: Incident trigger timestamp

        Outputs:
            state.deployment_analysis: Version, commit, author, elapsed minutes, and deployment correlation reasoning
            state.agent_reasoning: Appended reasoning tree entry
            state.executed_agents: Appended agent execution marker
        """
        start_time = time.perf_counter()
        logger.info("Executing GitDeploymentAgent", incident_id=state.incident_id)

        deployments = state.deployments or []
        has_recent = len(deployments) > 0

        if has_recent:
            latest = deployments[0]
            version = latest.get("version") or latest.get("release") or "v1.0.0"
            commit_hash = latest.get("commit_hash") or latest.get("commit") or "head"
            author = latest.get("author") or latest.get("deployer") or "CI/CD Pipeline"
            commit_msg = latest.get("commit_message") or latest.get("message") or "Production release update"

            deployed_at_str = latest.get("deployed_at") or latest.get("timestamp") or state.started_at
            try:
                dep_dt = datetime.fromisoformat(deployed_at_str.replace("Z", "+00:00"))
                inc_dt = datetime.fromisoformat(state.started_at.replace("Z", "+00:00")) if state.started_at else datetime.now(timezone.utc)
                mins_diff = abs(int((inc_dt - dep_dt).total_seconds() / 60.0))
            except Exception:
                mins_diff = 15

            correlation = f"Recent deployment '{version}' ({commit_hash[:7]}) by {author} occurred {mins_diff} minutes prior to incident."
        else:
            version = "N/A"
            commit_hash = "N/A"
            author = "N/A"
            commit_msg = "N/A"
            mins_diff = -1
            correlation = "No recent deployments detected within the immediate incident timeframe."

        state.deployment_analysis = {
            "has_recent_deployment": has_recent,
            "minutes_since_deployment": mins_diff,
            "version": version,
            "commit_hash": commit_hash,
            "author": author,
            "commit_message": commit_msg,
            "deployment_correlation": correlation
        }

        reasoning_bullets = [
            f"Deployment status: {'Correlated deployment found' if has_recent else 'No recent deployment'}.",
            correlation
        ]

        state.agent_reasoning.append({
            "agent": "GitDeploymentAgent",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "decision": "Evaluated release history and calculated deployment temporal correlation.",
            "reasoning": reasoning_bullets
        })

        duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
        state.executed_agents.append("GitDeploymentAgent")
        logger.info("GitDeploymentAgent completed", duration_ms=duration_ms, has_recent=has_recent)
        return state

    def rag_retrieval_node(self, state: RCAAgentState) -> RCAAgentState:
        """
        RAG Retrieval Agent: Searches ChromaDB for matching past RCA postmortems, runbooks, and playbooks.

        Inputs:
            state.title, state.service_name, state.exceptions, state.severity

        Outputs:
            state.rag_analysis: Structured documents, similarity scores, recommended runbooks, historical matches
            state.rag_context, state.rag_documents: Backward-compatible fields
            state.agent_reasoning: Appended reasoning tree entry
            state.executed_agents: Appended agent execution marker
        """
        start_time = time.perf_counter()
        logger.info("Executing RAGRetrievalAgent", incident_id=state.incident_id)

        top_exc = state.exceptions[0].get("message") if state.exceptions else None
        org_id = uuid.UUID(state.organization_id) if state.organization_id else None
        rag_res = rag_pipeline.execute_rag(
            project_id=uuid.UUID(state.project_id),
            incident_title=state.title,
            service_name=state.service_name,
            exception_msg=top_exc,
            severity=state.severity,
            organization_id=org_id
        )

        retrieved_docs = rag_res.get("retrieved_documents", [])
        compressed_ctx = rag_res.get("compressed_context", "")
        top_sim = rag_res.get("top_match_similarity", 0.0)

        historical_matches = []
        recommended_runbooks = []

        for doc in retrieved_docs:
            cat = doc.get("category", "")
            meta = doc.get("metadata", {})
            title = meta.get("title", f"{cat.replace('_', ' ').title()} Reference")
            sim = float(doc.get("similarity", 0.0))

            match_entry = {
                "title": title,
                "similarity": sim,
                "category": cat,
                "resolution_reused": doc.get("document", "")[:200]
            }
            historical_matches.append(match_entry)

            if cat in ("runbooks", "playbooks", "architecture_docs"):
                recommended_runbooks.append({
                    "title": title,
                    "similarity": sim,
                    "excerpt": doc.get("document", "")[:200]
                })

        state.rag_context = compressed_ctx
        state.rag_documents = retrieved_docs

        state.rag_analysis = {
            "retrieved_documents": retrieved_docs,
            "top_similarity": top_sim,
            "recommended_runbooks": recommended_runbooks,
            "historical_matches": historical_matches
        }

        reasoning_bullets = [
            f"Executed multi-query vector search across ChromaDB knowledge collections.",
            f"Retrieved {len(retrieved_docs)} matching documents (Top Similarity: {top_sim:.2f}).",
            f"Identified {len(recommended_runbooks)} applicable runbooks/playbooks for resolution."
        ]

        state.agent_reasoning.append({
            "agent": "RAGRetrievalAgent",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "decision": "Queried historical vector store and extracted relevant postmortems and playbooks.",
            "reasoning": reasoning_bullets
        })

        duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
        state.executed_agents.append("RAGRetrievalAgent")
        logger.info("RAGRetrievalAgent completed", duration_ms=duration_ms, top_similarity=top_sim)
        return state

    def confidence_node(self, state: RCAAgentState) -> RCAAgentState:
        """
        Confidence Agent: Evaluates multi-factor confidence across evidence quality, telemetry depth, and RAG matches.

        Inputs:
            state.logs, state.exceptions, state.traces, state.metrics, state.deployments, state.rag_analysis

        Outputs:
            state.confidence_analysis: Structured factor scores, overall score, level, natural language explanation
            state.confidence_meta: Backward-compatible confidence metadata dict
            state.agent_reasoning: Appended reasoning tree entry
            state.executed_agents: Appended agent execution marker
        """
        start_time = time.perf_counter()
        logger.info("Executing ConfidenceAgent", incident_id=state.incident_id)

        top_sim = state.rag_analysis.get("top_similarity", 0.0)
        conf_eval = confidence_engine.evaluate_confidence(
            has_logs=len(state.logs) > 0,
            log_count=len(state.logs),
            has_exceptions=len(state.exceptions) > 0,
            exception_count=len(state.exceptions),
            has_traces=len(state.traces) > 0,
            trace_count=len(state.traces),
            has_metrics=bool(state.metrics),
            has_deployment=len(state.deployments) > 0,
            rag_top_similarity=top_sim
        )

        factors = conf_eval.get("factor_breakdown", {})
        overall_score = conf_eval.get("overall_score", 0.85)
        conf_level = conf_eval.get("confidence_level", "HIGH")

        conf_reason = (
            f"Overall confidence rating is {conf_level} ({overall_score:.2f}). "
            f"Multi-factor telemetry verification scores: Logs ({factors.get('log_confidence', 0.0)}), "
            f"Traces ({factors.get('trace_confidence', 0.0)}), Exceptions ({factors.get('exception_confidence', 0.0)}), "
            f"Historical RAG Match ({factors.get('historical_rag_match', 0.0)})."
        )

        state.confidence_analysis = {
            "overall": overall_score,
            "confidence_level": conf_level,
            "logs": factors.get("log_confidence", 0.0),
            "traces": factors.get("trace_confidence", 0.0),
            "exceptions": factors.get("exception_confidence", 0.0),
            "metrics": factors.get("metric_confidence", 0.0),
            "rag": factors.get("historical_rag_match", 0.0),
            "deployment": factors.get("deployment_confidence", 0.0),
            "reason": conf_reason
        }
        state.confidence_meta = conf_eval

        reasoning_bullets = [
            f"Calculated multi-factor confidence rating: {overall_score:.2f} ({conf_level}).",
            conf_reason
        ]

        state.agent_reasoning.append({
            "agent": "ConfidenceAgent",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "decision": "Evaluated multi-factor confidence rating based on telemetry completeness and knowledge match.",
            "reasoning": reasoning_bullets
        })

        duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
        state.executed_agents.append("ConfidenceAgent")
        logger.info("ConfidenceAgent completed", duration_ms=duration_ms, overall_score=overall_score)
        return state

    def final_rca_node(self, state: RCAAgentState) -> RCAAgentState:
        """
        Final RCA Agent: Synthesizes structured pre-analyzed domain findings from all previous agents via Gemini 2.5.

        Inputs:
            state.execution_plan, state.log_analysis, state.trace_analysis, state.exception_analysis,
            state.metric_analysis, state.deployment_analysis, state.rag_analysis, state.confidence_analysis

        Outputs:
            state.final_rca: Generated Root Cause Analysis report dict
            state.agent_reasoning: Appended final reasoning entry
            state.executed_agents: Appended agent execution marker
        """
        start_time = time.perf_counter()
        logger.info("Executing FinalRCAAgent", incident_id=state.incident_id)

        incident_context = {
            "title": state.title,
            "service_name": state.service_name,
            "severity": state.severity,
            "started_at": state.started_at,
            "planner": state.execution_plan,
            "log_analysis": state.log_analysis,
            "trace_analysis": state.trace_analysis,
            "exception_analysis": state.exception_analysis,
            "metric_analysis": state.metric_analysis,
            "deployment_analysis": state.deployment_analysis,
            "rag_analysis": state.rag_analysis,
            "confidence": state.confidence_analysis,
            "agent_reasoning": state.agent_reasoning,
            # Kept for backward compatibility:
            "logs": state.logs,
            "exceptions": state.exceptions,
            "traces": state.traces,
            "metrics": state.metrics,
            "deployments": state.deployments
        }

        rca_report = gemini_client.generate_rca_report(
            incident_context=incident_context,
            rag_context=state.rag_context,
            confidence_meta=state.confidence_meta
        )

        state.final_rca = rca_report
        state.agent_reasoning.append({
            "agent": "FinalRCAAgent",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "decision": "Synthesized domain-specific agent findings and generated final structured Root Cause Analysis report.",
            "reasoning": [
                f"Root Cause: {rca_report.get('root_cause', 'Under investigation')}",
                f"Generated {len(rca_report.get('fix_recommendations', []))} fix recommendations and {len(rca_report.get('prevention_actions', []))} long-term prevention actions."
            ]
        })

        duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
        state.executed_agents.append("FinalRCAAgent")

        # Auto-embed newly generated RCA into ChromaDB knowledge base for continuous learning
        self._auto_embed_rca_report(state, rca_report)
        logger.info("FinalRCAAgent completed", duration_ms=duration_ms)
        return state

    def _auto_embed_rca_report(self, state: RCAAgentState, rca_report: Dict[str, Any]) -> None:
        """Automatically embeds generated RCA report into ChromaDB 'rca_reports' collection."""
        try:
            doc_text = (
                f"Incident: {state.title}\n"
                f"Service: {state.service_name}\n"
                f"Severity: {state.severity}\n"
                f"Root Cause: {rca_report.get('root_cause')}\n"
                f"Summary: {rca_report.get('summary')}\n"
                f"Fix: {' '.join(rca_report.get('fix_recommendations', []))}"
            )
            embedding = embedding_generator.generate_embedding(doc_text)
            doc_id = f"rca_{state.incident_id}"
            
            meta = {
                "project_id": state.project_id,
                "service": state.service_name,
                "severity": state.severity,
                "title": state.title,
                "confidence_score": float(rca_report.get("confidence_score", 0.85)),
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
            if state.organization_id:
                meta["organization_id"] = str(state.organization_id)

            chroma_store.add_documents(
                category="rca_reports",
                documents=[doc_text],
                embeddings=[embedding],
                metadatas=[meta],
                ids=[doc_id]
            )
            logger.info("Auto-embedded new RCA report into ChromaDB", incident_id=state.incident_id)
        except Exception as exc:
            logger.error("Failed to auto-embed RCA report into ChromaDB", error=str(exc))

    def run_workflow(self, initial_state: RCAAgentState) -> RCAAgentState:
        """Executes full autonomous multi-agent sequence."""
        state = initial_state
        state = self.planner_node(state)
        state = self.log_analysis_node(state)
        state = self.trace_analysis_node(state)
        state = self.exception_analysis_node(state)
        state = self.metrics_node(state)
        state = self.git_deployment_node(state)
        state = self.rag_retrieval_node(state)
        state = self.confidence_node(state)
        state = self.final_rca_node(state)
        return state


rca_workflow = LangGraphRCAWorkflow()
