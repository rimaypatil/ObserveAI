import uuid
from datetime import datetime, timezone
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models.telemetry import TelemetryLog, TelemetryTrace
from backend.repositories.telemetry_repository import TelemetryLogRepository, TelemetryTraceRepository
from tests.test_multi_tenancy import setup_multi_tenant_data


@pytest.mark.asyncio
async def test_timeseries_endpoints_empty_project(async_client: AsyncClient, setup_multi_tenant_data):
    data = setup_multi_tenant_data
    headers_a = {"Authorization": f"Bearer {data['token_a']}"}
    proj_a_id = data["proj_a"].id

    # Test Latency Timeseries for empty project
    resp = await async_client.get(f"/api/v1/telemetry/timeseries/latency?project_id={proj_a_id}", headers=headers_a)
    assert resp.status_code == 200
    assert resp.json()["data"] == []

    # Test Throughput Timeseries for empty project
    resp = await async_client.get(f"/api/v1/telemetry/timeseries/throughput?project_id={proj_a_id}", headers=headers_a)
    assert resp.status_code == 200
    assert resp.json()["data"] == []


@pytest.mark.asyncio
async def test_timeseries_endpoints_with_real_telemetry(async_client: AsyncClient, setup_multi_tenant_data, test_session: AsyncSession):
    data = setup_multi_tenant_data
    headers_a = {"Authorization": f"Bearer {data['token_a']}"}
    proj_a_id = data["proj_a"].id
    svc_a_id = uuid.uuid4()

    trace_repo = TelemetryTraceRepository(test_session)
    log_repo = TelemetryLogRepository(test_session)

    now = datetime.now(timezone.utc)

    # Insert traces into Project A
    t1 = await trace_repo.create(TelemetryTrace(
        project_id=proj_a_id,
        service_id=svc_a_id,
        timestamp=now,
        trace_id="tr-1",
        span_id="sp-1",
        operation_name="GET /api/v1/users",
        duration_ms=100.0,
        status_code=200
    ))
    t2 = await trace_repo.create(TelemetryTrace(
        project_id=proj_a_id,
        service_id=svc_a_id,
        timestamp=now,
        trace_id="tr-2",
        span_id="sp-2",
        operation_name="POST /api/v1/checkout",
        duration_ms=500.0,
        status_code=500
    ))

    # Insert error log into Project A
    l1 = await log_repo.create(TelemetryLog(
        project_id=proj_a_id,
        service_id=svc_a_id,
        timestamp=now,
        level="ERROR",
        message="Database connection pool exhausted"
    ))

    await test_session.commit()

    # Query Latency Timeseries
    resp = await async_client.get(f"/api/v1/telemetry/timeseries/latency?project_id={proj_a_id}", headers=headers_a)
    assert resp.status_code == 200
    lat_data = resp.json()["data"]
    assert len(lat_data) == 1
    assert lat_data[0]["p50_ms"] == 100.0
    assert lat_data[0]["p99_ms"] == 500.0

    # Query Throughput Timeseries
    resp = await async_client.get(f"/api/v1/telemetry/timeseries/throughput?project_id={proj_a_id}", headers=headers_a)
    assert resp.status_code == 200
    tp_data = resp.json()["data"]
    assert len(tp_data) == 1
    assert tp_data[0]["request_count"] == 2
    assert tp_data[0]["error_count"] >= 1


@pytest.mark.asyncio
async def test_timeseries_cross_organization_isolation(async_client: AsyncClient, setup_multi_tenant_data):
    data = setup_multi_tenant_data
    headers_b = {"Authorization": f"Bearer {data['token_b']}"}
    proj_a_id = data["proj_a"].id

    # User B trying to access Project A timeseries latency -> 404
    resp = await async_client.get(f"/api/v1/telemetry/timeseries/latency?project_id={proj_a_id}", headers=headers_b)
    assert resp.status_code == 404

    # User B trying to access Project A timeseries throughput -> 404
    resp = await async_client.get(f"/api/v1/telemetry/timeseries/throughput?project_id={proj_a_id}", headers=headers_b)
    assert resp.status_code == 404
