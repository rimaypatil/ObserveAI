import uuid
from datetime import datetime, timezone
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from backend.incidents.detector import incident_detector, compute_fingerprint
from backend.models.incidents import Incident
from backend.repositories.incident_repository import IncidentRepository
from tests.test_multi_tenancy import setup_multi_tenant_data


@pytest.mark.asyncio
async def test_successful_request_creates_no_incident(async_client: AsyncClient, setup_multi_tenant_data, test_session: AsyncSession):
    """1. Successful request -> no incident"""
    data = setup_multi_tenant_data
    payload = {
        "service_name": "api-service",
        "environment": "production",
        "logs": [{"timestamp": datetime.now(timezone.utc).isoformat(), "level": "INFO", "message": "HTTP GET / - Status 200"}],
        "exceptions": [],
        "traces": [{"timestamp": datetime.now(timezone.utc).isoformat(), "trace_id": "t1", "span_id": "s1", "operation_name": "GET /", "duration_ms": 12.0, "status_code": 200}],
        "metrics": [],
        "deployments": []
    }
    resp = await async_client.post("/api/v1/sdk/ingest", json=payload, headers={"X-API-Key": data["raw_key_a"]})
    assert resp.status_code == 202
    res = resp.json()["data"]
    assert res["incident_triggered"] is False
    assert res["incident_id"] is None


@pytest.mark.asyncio
async def test_404_creates_incident(async_client: AsyncClient, setup_multi_tenant_data, test_session: AsyncSession):
    """2. 404 -> incident"""
    data = setup_multi_tenant_data
    payload = {
        "service_name": "api-service",
        "environment": "production",
        "logs": [{"timestamp": datetime.now(timezone.utc).isoformat(), "level": "ERROR", "message": "HTTP GET /does-not-exist - Status 404"}],
        "exceptions": [],
        "traces": [{"timestamp": datetime.now(timezone.utc).isoformat(), "trace_id": "t404", "span_id": "s404", "operation_name": "GET /does-not-exist", "duration_ms": 25.0, "status_code": 404}],
        "metrics": [],
        "deployments": []
    }
    resp = await async_client.post("/api/v1/sdk/ingest", json=payload, headers={"X-API-Key": data["raw_key_a"]})
    assert resp.status_code == 202
    res = resp.json()["data"]
    assert res["incident_triggered"] is True
    assert res["incident_id"] is not None


@pytest.mark.asyncio
async def test_repeated_404_groups_into_same_active_incident(async_client: AsyncClient, setup_multi_tenant_data, test_session: AsyncSession):
    """3. repeated 404 -> same active incident"""
    data = setup_multi_tenant_data
    payload = {
        "service_name": "api-service",
        "environment": "production",
        "logs": [{"timestamp": datetime.now(timezone.utc).isoformat(), "level": "ERROR", "message": "HTTP GET /does-not-exist - Status 404"}],
        "exceptions": [],
        "traces": [{"timestamp": datetime.now(timezone.utc).isoformat(), "trace_id": "t404_a", "span_id": "s404_a", "operation_name": "GET /does-not-exist", "duration_ms": 20.0, "status_code": 404}],
        "metrics": [],
        "deployments": []
    }
    resp1 = await async_client.post("/api/v1/sdk/ingest", json=payload, headers={"X-API-Key": data["raw_key_a"]})
    inc_id1 = resp1.json()["data"]["incident_id"]

    resp2 = await async_client.post("/api/v1/sdk/ingest", json=payload, headers={"X-API-Key": data["raw_key_a"]})
    inc_id2 = resp2.json()["data"]["incident_id"]

    assert inc_id1 == inc_id2


@pytest.mark.asyncio
async def test_error_500_creates_incident(async_client: AsyncClient, setup_multi_tenant_data, test_session: AsyncSession):
    """4. /error 500 -> incident"""
    data = setup_multi_tenant_data
    payload = {
        "service_name": "api-service",
        "environment": "production",
        "logs": [{"timestamp": datetime.now(timezone.utc).isoformat(), "level": "ERROR", "message": "Unhandled Route Error: Payment Gateway Connection Failed"}],
        "exceptions": [{"timestamp": datetime.now(timezone.utc).isoformat(), "exception_type": "PaymentGatewayError", "message": "Payment Gateway Connection Failed", "stacktrace": "gateway.py:10", "handled": True}],
        "traces": [{"timestamp": datetime.now(timezone.utc).isoformat(), "trace_id": "terr", "span_id": "serr", "operation_name": "GET /error", "duration_ms": 110.0, "status_code": 500}],
        "metrics": [],
        "deployments": []
    }
    resp = await async_client.post("/api/v1/sdk/ingest", json=payload, headers={"X-API-Key": data["raw_key_a"]})
    assert resp.status_code == 202
    res = resp.json()["data"]
    assert res["incident_triggered"] is True
    assert res["incident_id"] is not None


@pytest.mark.asyncio
async def test_repeated_error_groups_into_same_active_incident(async_client: AsyncClient, setup_multi_tenant_data, test_session: AsyncSession):
    """5. repeated /error -> same active incident"""
    data = setup_multi_tenant_data
    payload = {
        "service_name": "api-service",
        "environment": "production",
        "logs": [{"timestamp": datetime.now(timezone.utc).isoformat(), "level": "ERROR", "message": "Unhandled Route Error: Payment Gateway Connection Failed"}],
        "exceptions": [{"timestamp": datetime.now(timezone.utc).isoformat(), "exception_type": "PaymentGatewayError", "message": "Payment Gateway Connection Failed", "stacktrace": "gateway.py:10", "handled": True}],
        "traces": [{"timestamp": datetime.now(timezone.utc).isoformat(), "trace_id": "terr1", "span_id": "serr1", "operation_name": "GET /error", "duration_ms": 110.0, "status_code": 500}],
        "metrics": [],
        "deployments": []
    }
    resp1 = await async_client.post("/api/v1/sdk/ingest", json=payload, headers={"X-API-Key": data["raw_key_a"]})
    inc_id1 = resp1.json()["data"]["incident_id"]

    resp2 = await async_client.post("/api/v1/sdk/ingest", json=payload, headers={"X-API-Key": data["raw_key_a"]})
    inc_id2 = resp2.json()["data"]["incident_id"]

    assert inc_id1 == inc_id2


@pytest.mark.asyncio
async def test_database_failure_creates_separate_incident(async_client: AsyncClient, setup_multi_tenant_data, test_session: AsyncSession):
    """6. /database -> separate incident"""
    data = setup_multi_tenant_data
    payload = {
        "service_name": "api-service",
        "environment": "production",
        "logs": [{"timestamp": datetime.now(timezone.utc).isoformat(), "level": "ERROR", "message": "Database Connection Failed"}],
        "exceptions": [{"timestamp": datetime.now(timezone.utc).isoformat(), "exception_type": "DBConnectionTimeoutError", "message": "PostgreSQL pool timeout", "stacktrace": "db.py:20", "handled": False}],
        "traces": [{"timestamp": datetime.now(timezone.utc).isoformat(), "trace_id": "tdb", "span_id": "sdb", "operation_name": "GET /database", "duration_ms": 3200.0, "status_code": 500}],
        "metrics": [],
        "deployments": []
    }
    resp = await async_client.post("/api/v1/sdk/ingest", json=payload, headers={"X-API-Key": data["raw_key_a"]})
    assert resp.status_code == 202
    assert resp.json()["data"]["incident_triggered"] is True


@pytest.mark.asyncio
async def test_crash_creates_separate_incident(async_client: AsyncClient, setup_multi_tenant_data, test_session: AsyncSession):
    """7. /crash -> separate incident"""
    data = setup_multi_tenant_data
    payload = {
        "service_name": "api-service",
        "environment": "production",
        "logs": [{"timestamp": datetime.now(timezone.utc).isoformat(), "level": "ERROR", "message": "Fatal Crash"}],
        "exceptions": [{"timestamp": datetime.now(timezone.utc).isoformat(), "exception_type": "NullPointerDereference", "message": "TaskWorker crash", "stacktrace": "worker.py:12", "handled": True}],
        "traces": [{"timestamp": datetime.now(timezone.utc).isoformat(), "trace_id": "tcrash", "span_id": "scrash", "operation_name": "GET /crash", "duration_ms": 40.0, "status_code": 500}],
        "metrics": [],
        "deployments": []
    }
    resp = await async_client.post("/api/v1/sdk/ingest", json=payload, headers={"X-API-Key": data["raw_key_a"]})
    assert resp.status_code == 202
    assert resp.json()["data"]["incident_triggered"] is True


@pytest.mark.asyncio
async def test_slow_request_creates_slow_incident(async_client: AsyncClient, setup_multi_tenant_data, test_session: AsyncSession):
    """8. /slow -> slow incident"""
    data = setup_multi_tenant_data
    payload = {
        "service_name": "api-service",
        "environment": "production",
        "logs": [],
        "exceptions": [],
        "traces": [{"timestamp": datetime.now(timezone.utc).isoformat(), "trace_id": "tslow", "span_id": "sslow", "operation_name": "GET /slow", "duration_ms": 4500.0, "status_code": 200}],
        "metrics": [],
        "deployments": []
    }
    resp = await async_client.post("/api/v1/sdk/ingest", json=payload, headers={"X-API-Key": data["raw_key_a"]})
    assert resp.status_code == 202
    assert resp.json()["data"]["incident_triggered"] is True


@pytest.mark.asyncio
async def test_error_and_database_cannot_incorrectly_share_incident(async_client: AsyncClient, setup_multi_tenant_data, test_session: AsyncSession):
    """9. /error and /database cannot incorrectly share an incident"""
    data = setup_multi_tenant_data

    payload_err = {
        "service_name": "shared-service",
        "environment": "production",
        "logs": [{"timestamp": datetime.now(timezone.utc).isoformat(), "level": "ERROR", "message": "Payment Gateway Connection Failed"}],
        "exceptions": [{"timestamp": datetime.now(timezone.utc).isoformat(), "exception_type": "PaymentGatewayError", "message": "Payment Gateway Connection Failed", "stacktrace": "gw.py:1", "handled": True}],
        "traces": [{"timestamp": datetime.now(timezone.utc).isoformat(), "trace_id": "t1", "span_id": "s1", "operation_name": "GET /error", "duration_ms": 100.0, "status_code": 500}],
        "metrics": [],
        "deployments": []
    }
    resp1 = await async_client.post("/api/v1/sdk/ingest", json=payload_err, headers={"X-API-Key": data["raw_key_a"]})
    inc_err_id = resp1.json()["data"]["incident_id"]

    payload_db = {
        "service_name": "shared-service",
        "environment": "production",
        "logs": [{"timestamp": datetime.now(timezone.utc).isoformat(), "level": "ERROR", "message": "Database Timeout"}],
        "exceptions": [{"timestamp": datetime.now(timezone.utc).isoformat(), "exception_type": "DBConnectionTimeoutError", "message": "DB Pool Exhausted", "stacktrace": "db.py:1", "handled": False}],
        "traces": [{"timestamp": datetime.now(timezone.utc).isoformat(), "trace_id": "t2", "span_id": "s2", "operation_name": "GET /database", "duration_ms": 3200.0, "status_code": 500}],
        "metrics": [],
        "deployments": []
    }
    resp2 = await async_client.post("/api/v1/sdk/ingest", json=payload_db, headers={"X-API-Key": data["raw_key_a"]})
    inc_db_id = resp2.json()["data"]["incident_id"]

    assert inc_err_id != inc_db_id


@pytest.mark.asyncio
async def test_handled_exception_still_triggers_incident(async_client: AsyncClient, setup_multi_tenant_data, test_session: AsyncSession):
    """10. handled exception still triggers incident"""
    data = setup_multi_tenant_data
    payload = {
        "service_name": "api-service",
        "environment": "production",
        "logs": [],
        "exceptions": [{"timestamp": datetime.now(timezone.utc).isoformat(), "exception_type": "HandledAppError", "message": "Error caught by middleware", "stacktrace": "main.py:5", "handled": True}],
        "traces": [],
        "metrics": [],
        "deployments": []
    }
    resp = await async_client.post("/api/v1/sdk/ingest", json=payload, headers={"X-API-Key": data["raw_key_a"]})
    assert resp.status_code == 202
    assert resp.json()["data"]["incident_triggered"] is True


@pytest.mark.asyncio
async def test_single_error_log_triggers_incident(async_client: AsyncClient, setup_multi_tenant_data, test_session: AsyncSession):
    """11. single ERROR log triggers incident"""
    data = setup_multi_tenant_data
    payload = {
        "service_name": "api-service",
        "environment": "production",
        "logs": [{"timestamp": datetime.now(timezone.utc).isoformat(), "level": "ERROR", "message": "Isolated single error log"}],
        "exceptions": [],
        "traces": [],
        "metrics": [],
        "deployments": []
    }
    resp = await async_client.post("/api/v1/sdk/ingest", json=payload, headers={"X-API-Key": data["raw_key_a"]})
    assert resp.status_code == 202
    assert resp.json()["data"]["incident_triggered"] is True


@pytest.mark.asyncio
async def test_single_http_500_trace_triggers_incident(async_client: AsyncClient, setup_multi_tenant_data, test_session: AsyncSession):
    """12. single HTTP 500 trace triggers incident"""
    data = setup_multi_tenant_data
    payload = {
        "service_name": "api-service",
        "environment": "production",
        "logs": [],
        "exceptions": [],
        "traces": [{"timestamp": datetime.now(timezone.utc).isoformat(), "trace_id": "t500_single", "span_id": "s500_single", "operation_name": "POST /submit", "duration_ms": 40.0, "status_code": 500}],
        "metrics": [],
        "deployments": []
    }
    resp = await async_client.post("/api/v1/sdk/ingest", json=payload, headers={"X-API-Key": data["raw_key_a"]})
    assert resp.status_code == 202
    assert resp.json()["data"]["incident_triggered"] is True


@pytest.mark.asyncio
async def test_multiple_telemetry_records_for_one_trace_produce_one_incident(async_client: AsyncClient, setup_multi_tenant_data, test_session: AsyncSession):
    """13. multiple telemetry records for one trace produce one incident"""
    data = setup_multi_tenant_data
    payload = {
        "service_name": "checkout-service",
        "environment": "production",
        "logs": [{"timestamp": datetime.now(timezone.utc).isoformat(), "level": "ERROR", "message": "Failed checkout", "trace_id": "trace_mult"}],
        "exceptions": [{"timestamp": datetime.now(timezone.utc).isoformat(), "exception_type": "CheckoutFailed", "message": "Checkout failed", "stacktrace": "ck.py:1", "handled": True, "trace_id": "trace_mult"}],
        "traces": [{"timestamp": datetime.now(timezone.utc).isoformat(), "trace_id": "trace_mult", "span_id": "span_mult", "operation_name": "POST /checkout", "duration_ms": 300.0, "status_code": 500}],
        "metrics": [],
        "deployments": []
    }
    resp = await async_client.post("/api/v1/sdk/ingest", json=payload, headers={"X-API-Key": data["raw_key_a"]})
    assert resp.status_code == 202
    assert resp.json()["data"]["incident_triggered"] is True
    # Ingestion batch processes this single batch into ONE incident


@pytest.mark.asyncio
async def test_resolved_incident_can_create_new_incident_later(async_client: AsyncClient, setup_multi_tenant_data, test_session: AsyncSession):
    """14. resolved incident can create a new incident later"""
    data = setup_multi_tenant_data
    payload = {
        "service_name": "resolvable-service",
        "environment": "production",
        "logs": [{"timestamp": datetime.now(timezone.utc).isoformat(), "level": "ERROR", "message": "Intermittent failure"}],
        "exceptions": [],
        "traces": [{"timestamp": datetime.now(timezone.utc).isoformat(), "trace_id": "tres1", "span_id": "sres1", "operation_name": "GET /res", "duration_ms": 50.0, "status_code": 500}],
        "metrics": [],
        "deployments": []
    }

    # Step 1: Create incident 1
    resp1 = await async_client.post("/api/v1/sdk/ingest", json=payload, headers={"X-API-Key": data["raw_key_a"]})
    inc_id1 = uuid.UUID(resp1.json()["data"]["incident_id"])

    # Step 2: Mark incident 1 as RESOLVED
    repo = IncidentRepository(test_session)
    incident1 = await repo.get_by_id(inc_id1)
    incident1.status = "RESOLVED"
    await test_session.flush()

    # Step 3: Send same failure batch -> creates new incident because incident 1 is RESOLVED
    resp2 = await async_client.post("/api/v1/sdk/ingest", json=payload, headers={"X-API-Key": data["raw_key_a"]})
    inc_id2 = uuid.UUID(resp2.json()["data"]["incident_id"])

    assert inc_id1 != inc_id2


@pytest.mark.asyncio
async def test_organization_isolation_in_incidents(async_client: AsyncClient, setup_multi_tenant_data, test_session: AsyncSession):
    """15. organization A cannot see/create incidents for organization B"""
    data = setup_multi_tenant_data

    # Ingest for Org A
    payload_a = {
        "service_name": "service-a",
        "environment": "production",
        "logs": [{"timestamp": datetime.now(timezone.utc).isoformat(), "level": "ERROR", "message": "Org A failure"}],
        "exceptions": [],
        "traces": [{"timestamp": datetime.now(timezone.utc).isoformat(), "trace_id": "ta", "span_id": "sa", "operation_name": "GET /orga", "duration_ms": 10.0, "status_code": 500}],
        "metrics": [],
        "deployments": []
    }
    resp_a = await async_client.post("/api/v1/sdk/ingest", json=payload_a, headers={"X-API-Key": data["raw_key_a"]})
    inc_a_id = resp_a.json()["data"]["incident_id"]

    # User B lists incidents for Project B -> cannot see Inc A
    resp_b_list = await async_client.get(
        f"/api/v1/incidents?project_id={data['proj_b'].id}",
        headers={"Authorization": f"Bearer {data['token_b']}"}
    )
    assert resp_b_list.status_code == 200
    b_inc_ids = [inc["id"] for inc in resp_b_list.json()["data"]]
    assert inc_a_id not in b_inc_ids


@pytest.mark.asyncio
async def test_project_isolation_in_incidents(async_client: AsyncClient, setup_multi_tenant_data, test_session: AsyncSession):
    """16. project A cannot see/create incidents for project B"""
    data = setup_multi_tenant_data

    # Ingest for Project A
    payload_a = {
        "service_name": "proj-a-service",
        "environment": "production",
        "logs": [{"timestamp": datetime.now(timezone.utc).isoformat(), "level": "ERROR", "message": "Proj A error"}],
        "exceptions": [],
        "traces": [{"timestamp": datetime.now(timezone.utc).isoformat(), "trace_id": "tpa", "span_id": "spa", "operation_name": "GET /proja", "duration_ms": 10.0, "status_code": 500}],
        "metrics": [],
        "deployments": []
    }
    resp_a = await async_client.post("/api/v1/sdk/ingest", json=payload_a, headers={"X-API-Key": data["raw_key_a"]})
    inc_a_id = resp_a.json()["data"]["incident_id"]

    # Query Incidents for Project A
    resp_list_a = await async_client.get(
        f"/api/v1/incidents?project_id={data['proj_a'].id}",
        headers={"Authorization": f"Bearer {data['token_a']}"}
    )
    assert resp_list_a.status_code == 200
    a_inc_ids = [inc["id"] for inc in resp_list_a.json()["data"]]
    assert inc_a_id in a_inc_ids
