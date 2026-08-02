import uuid
from backend.agents.state import RCAAgentState
from backend.agents.workflow import rca_workflow


def test_langgraph_rca_workflow_execution():
    initial_state = RCAAgentState(
        incident_id=str(uuid.uuid4()),
        project_id=str(uuid.uuid4()),
        service_id=str(uuid.uuid4()),
        service_name="payment-service",
        title="P0 Incident: Database Connection Timeout",
        severity="P0",
        started_at="2026-08-02T08:00:00Z",
        logs=[{"level": "ERROR", "message": "Failed to acquire DB connection from pool."}],
        exceptions=[{
            "exception_type": "TimeoutError",
            "message": "Connection to PostgreSQL timed out after 3000ms.",
            "stacktrace": "File 'db.py', line 45, in connect"
        }],
        traces=[{"trace_id": "abc12345", "duration_ms": 3500.0, "status_code": 500}]
    )

    final_state = rca_workflow.run_workflow(initial_state)

    assert "PlannerAgent" in final_state.executed_agents
    assert "FinalRCAAgent" in final_state.executed_agents
    assert final_state.final_rca is not None
    assert "summary" in final_state.final_rca
    assert "root_cause" in final_state.final_rca
    assert "fix_recommendations" in final_state.final_rca
