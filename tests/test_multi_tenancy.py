import uuid
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models.users import User, Organization
from backend.models.projects import Project, ApiKey, Service
from backend.models.incidents import Incident, RcaReport
from backend.repositories.user_repository import UserRepository, OrganizationRepository
from backend.repositories.project_repository import ProjectRepository, ApiKeyRepository, ServiceRepository
from backend.repositories.incident_repository import IncidentRepository, RcaReportRepository
from backend.utils.security import create_access_token, generate_api_key, hash_api_key, hash_password


import pytest_asyncio


@pytest_asyncio.fixture
async def setup_multi_tenant_data(test_session: AsyncSession):
    """Sets up Organization A (User A, Project A, Key A, Incident A) and Organization B (User B, Project B, Key B)."""
    org_repo = OrganizationRepository(test_session)
    user_repo = UserRepository(test_session)
    proj_repo = ProjectRepository(test_session)
    key_repo = ApiKeyRepository(test_session)
    svc_repo = ServiceRepository(test_session)
    inc_repo = IncidentRepository(test_session)
    rca_repo = RcaReportRepository(test_session)

    uid = uuid.uuid4().hex[:8]

    # 1. Setup Organization A
    org_a = await org_repo.create(Organization(name=f"Org A {uid}", slug=f"org-a-{uid}", plan="enterprise"))
    user_a = await user_repo.create(User(
        email=f"usera-{uid}@org-a.com",
        password_hash=hash_password("PassA123!"),
        full_name="User A",
        role="owner",
        organization_id=org_a.id
    ))
    proj_a = await proj_repo.create(Project(
        organization_id=org_a.id,
        name=f"Project A {uid}",
        slug=f"project-a-{uid}",
        environment="production"
    ))
    raw_key_a, hashed_key_a = generate_api_key(environment="production")
    key_a = await key_repo.create(ApiKey(
        project_id=proj_a.id,
        name="Key A",
        key_hash=hashed_key_a,
        prefix=raw_key_a[:12],
        environment="production"
    ))
    svc_a = await svc_repo.create(Service(
        project_id=proj_a.id,
        name=f"auth-service-a-{uid}",
        type="backend"
    ))
    inc_a = await inc_repo.create(Incident(
        project_id=proj_a.id,
        service_id=svc_a.id,
        title="P1 Incident Org A",
        severity="P1",
        status="INVESTIGATING"
    ))
    rca_a = await rca_repo.create(RcaReport(
        incident_id=inc_a.id,
        project_id=proj_a.id,
        summary="Org A RCA Summary",
        root_cause="Memory leak in Org A service",
        timeline_json=[],
        evidence_json={},
        historical_matches_json=[],
        fix_recommendations_json=["Restart service"],
        prevention_actions_json=["Increase heap"],
        confidence_score=0.95
    ))

    # 2. Setup Organization B
    org_b = await org_repo.create(Organization(name=f"Org B {uid}", slug=f"org-b-{uid}", plan="enterprise"))
    user_b = await user_repo.create(User(
        email=f"userb-{uid}@org-b.com",
        password_hash=hash_password("PassB123!"),
        full_name="User B",
        role="owner",
        organization_id=org_b.id
    ))
    proj_b = await proj_repo.create(Project(
        organization_id=org_b.id,
        name=f"Project B {uid}",
        slug=f"project-b-{uid}",
        environment="production"
    ))
    raw_key_b, hashed_key_b = generate_api_key(environment="production")
    key_b = await key_repo.create(ApiKey(
        project_id=proj_b.id,
        name="Key B",
        key_hash=hashed_key_b,
        prefix=raw_key_b[:12],
        environment="production"
    ))

    await test_session.commit()

    token_a = create_access_token(subject=str(user_a.id), extra_claims={"org_id": str(org_a.id), "role": "owner"})
    token_b = create_access_token(subject=str(user_b.id), extra_claims={"org_id": str(org_b.id), "role": "owner"})

    return {
        "org_a": org_a, "user_a": user_a, "proj_a": proj_a, "key_a": key_a, "raw_key_a": raw_key_a, "inc_a": inc_a, "token_a": token_a,
        "org_b": org_b, "user_b": user_b, "proj_b": proj_b, "key_b": key_b, "raw_key_b": raw_key_b, "token_b": token_b
    }


@pytest.mark.asyncio
async def test_user_a_cannot_see_user_b_projects(async_client: AsyncClient, setup_multi_tenant_data):
    data = setup_multi_tenant_data
    headers_b = {"Authorization": f"Bearer {data['token_b']}"}

    resp = await async_client.get("/api/v1/projects", headers=headers_b)
    assert resp.status_code == 200
    res_data = resp.json()["data"]
    project_ids = [p["id"] for p in res_data]

    assert str(data["proj_b"].id) in project_ids
    assert str(data["proj_a"].id) not in project_ids


@pytest.mark.asyncio
async def test_cross_organization_project_access_denied(async_client: AsyncClient, setup_multi_tenant_data):
    data = setup_multi_tenant_data
    headers_b = {"Authorization": f"Bearer {data['token_b']}"}
    proj_a_id = data["proj_a"].id

    # User B attempting to list services of Project A
    resp = await async_client.get(f"/api/v1/projects/{proj_a_id}/services", headers=headers_b)
    assert resp.status_code == 404

    # User B attempting to update Project A
    resp = await async_client.put(f"/api/v1/projects/{proj_a_id}", json={"name": "Hacked Name"}, headers=headers_b)
    assert resp.status_code == 404

    # User B attempting to delete Project A
    resp = await async_client.delete(f"/api/v1/projects/{proj_a_id}", headers=headers_b)
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_cross_organization_api_key_operations_denied(async_client: AsyncClient, setup_multi_tenant_data):
    data = setup_multi_tenant_data
    headers_b = {"Authorization": f"Bearer {data['token_b']}"}
    proj_a_id = data["proj_a"].id
    key_a_id = data["key_a"].id

    # User B attempting to create API key under Project A
    resp = await async_client.post(f"/api/v1/projects/{proj_a_id}/api-keys", json={"name": "Hacker Key"}, headers=headers_b)
    assert resp.status_code == 404

    # User B attempting to rotate Key A
    resp = await async_client.post(f"/api/v1/projects/{proj_a_id}/api-keys/{key_a_id}/rotate", headers=headers_b)
    assert resp.status_code == 404

    # User B attempting to disable Key A
    resp = await async_client.post(f"/api/v1/projects/{proj_a_id}/api-keys/{key_a_id}/disable", headers=headers_b)
    assert resp.status_code == 404

    # User B attempting to delete Key A
    resp = await async_client.delete(f"/api/v1/projects/{proj_a_id}/api-keys/{key_a_id}", headers=headers_b)
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_cross_organization_telemetry_query_denied(async_client: AsyncClient, setup_multi_tenant_data):
    data = setup_multi_tenant_data
    headers_b = {"Authorization": f"Bearer {data['token_b']}"}
    proj_a_id = data["proj_a"].id

    resp = await async_client.get(f"/api/v1/telemetry/logs?project_id={proj_a_id}", headers=headers_b)
    assert resp.status_code == 404

    resp = await async_client.get(f"/api/v1/telemetry/exceptions?project_id={proj_a_id}", headers=headers_b)
    assert resp.status_code == 404

    resp = await async_client.get(f"/api/v1/telemetry/summary?project_id={proj_a_id}", headers=headers_b)
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_cross_organization_incident_access_denied(async_client: AsyncClient, setup_multi_tenant_data):
    data = setup_multi_tenant_data
    headers_b = {"Authorization": f"Bearer {data['token_b']}"}
    proj_a_id = data["proj_a"].id
    inc_a_id = data["inc_a"].id

    # User B listing incidents for Project A -> 404
    resp = await async_client.get(f"/api/v1/incidents?project_id={proj_a_id}", headers=headers_b)
    assert resp.status_code == 404

    # User B accessing Incident A details directly -> 404
    resp = await async_client.get(f"/api/v1/incidents/{inc_a_id}", headers=headers_b)
    assert resp.status_code == 404

    # User B adding comment to Incident A -> 404
    resp = await async_client.post(f"/api/v1/incidents/{inc_a_id}/comments", json={"comment": "Malicious comment"}, headers=headers_b)
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_cross_organization_rag_retrieval_denied(async_client: AsyncClient, setup_multi_tenant_data):
    data = setup_multi_tenant_data
    headers_b = {"Authorization": f"Bearer {data['token_b']}"}
    proj_a_id = data["proj_a"].id

    resp = await async_client.post(f"/api/v1/knowledge/search?project_id={proj_a_id}", json={"query": "leak"}, headers=headers_b)
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_global_search_is_organization_scoped(async_client: AsyncClient, setup_multi_tenant_data):
    data = setup_multi_tenant_data
    headers_b = {"Authorization": f"Bearer {data['token_b']}"}

    resp = await async_client.get("/api/v1/search?query=Org%20A", headers=headers_b)
    assert resp.status_code == 200
    res_items = resp.json()["data"]["items"]
    assert len(res_items) == 0


@pytest.mark.asyncio
async def test_sdk_a_ingests_only_into_project_a(async_client: AsyncClient, setup_multi_tenant_data):
    data = setup_multi_tenant_data
    key_a = data["raw_key_a"]

    payload = {
        "service_name": "billing-service",
        "environment": "production",
        "logs": [{"timestamp": "2026-08-16T12:00:00Z", "level": "INFO", "message": "SDK A payload"}],
        "exceptions": [],
        "traces": [],
        "metrics": [],
        "deployments": []
    }
    resp = await async_client.post("/api/v1/sdk/ingest", json=payload, headers={"X-API-Key": key_a})
    assert resp.status_code == 202
