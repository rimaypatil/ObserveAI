import uuid
from backend.agents.state import RCAAgentState
from backend.agents.workflow import rca_workflow


def test_phase3_multi_agent_workflow_reasoning():
    initial_state = RCAAgentState(
        incident_id=str(uuid.uuid4()),
        project_id=str(uuid.uuid4()),
        service_id=str(uuid.uuid4()),
        service_name="payment-checkout",
        title="P0 Incident: Checkout Service 500 Spike and DB Timeout",
        severity="P0",
        started_at="2026-08-06T12:00:00Z",
        logs=[
            {"level": "ERROR", "message": "Connection to PostgreSQL database pool timed out", "logger": "db_pool", "endpoint": "/checkout"},
            {"level": "ERROR", "message": "Connection to PostgreSQL database pool timed out", "logger": "db_pool", "endpoint": "/checkout"},
            {"level": "WARN", "message": "High active connections ratio 95%", "logger": "metrics"}
        ],
        exceptions=[
            {
                "exception_type": "DBConnectionTimeoutError",
                "message": "Connection pool exhausted after 3000ms wait",
                "handled": False,
                "stacktrace": "File 'db/pool.py', line 102, in acquire_connection\n  raise DBConnectionTimeoutError()"
            }
        ],
        traces=[
            {"trace_id": "tr_111", "name": "POST /checkout", "endpoint": "/checkout", "duration_ms": 3550.0, "status_code": 500},
            {"trace_id": "tr_222", "name": "GET /health", "endpoint": "/health", "duration_ms": 12.0, "status_code": 200}
        ],
        metrics={
            "cpu_usage": 91.2,
            "memory_usage": 88.0,
            "latency": 3550.0
        },
        deployments=[
            {
                "version": "v2.4.1",
                "commit_hash": "a1b2c3d4e5f",
                "author": "devops@observeai.io",
                "commit_message": "Migrate DB pool settings to min_size=50",
                "deployed_at": "2026-08-06T11:45:00Z"
            }
        ]
    )

    final_state = rca_workflow.run_workflow(initial_state)

    # 1. Verify Planner
    assert "PlannerAgent" in final_state.executed_agents
    assert final_state.execution_plan.get("run_log_agent") is True

    # 2. Verify Log Analysis Agent
    assert final_state.log_analysis["total_logs"] == 3
    assert final_state.log_analysis["error_count"] == 2
    assert final_state.log_analysis["dominant_level"] == "ERROR"
    assert len(final_state.log_analysis["top_errors"]) > 0

    # 3. Verify Trace Analysis Agent
    assert final_state.trace_analysis["total_traces"] == 2
    assert final_state.trace_analysis["max_latency_ms"] == 3550.0
    assert final_state.trace_analysis["slowest_endpoint"] == "/checkout"

    # 4. Verify Exception Analysis Agent
    assert final_state.exception_analysis["unhandled_count"] == 1
    assert "DBConnectionTimeoutError" in final_state.exception_analysis["primary_exception"]
    assert "db/pool.py" in final_state.exception_analysis["affected_files"]

    # 5. Verify Metrics Agent
    assert final_state.metric_analysis["cpu_spike"] is True
    assert len(final_state.metric_analysis["anomalies"]) > 0

    # 6. Verify Deployment Agent
    assert final_state.deployment_analysis["has_recent_deployment"] is True
    assert final_state.deployment_analysis["version"] == "v2.4.1"

    # 7. Verify RAG & Confidence Agents
    assert final_state.confidence_analysis["overall"] > 0.0
    assert "reason" in final_state.confidence_analysis

    # 8. Verify Reasoning Timeline
    assert len(final_state.agent_reasoning) >= 8
    agents_in_timeline = [entry["agent"] for entry in final_state.agent_reasoning]
    assert "PlannerAgent" in agents_in_timeline
    assert "LogAnalysisAgent" in agents_in_timeline
    assert "TraceAnalysisAgent" in agents_in_timeline
    assert "FinalRCAAgent" in agents_in_timeline

    # 9. Verify Final RCA output
    assert final_state.final_rca is not None
    assert "root_cause" in final_state.final_rca
