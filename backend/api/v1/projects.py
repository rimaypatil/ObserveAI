import uuid
from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from backend.api.dependencies import get_current_user
from backend.database.session import get_async_session
from backend.models.users import User
from backend.schemas.auth import ApiKeyCreate, ApiKeyResponse
from backend.schemas.common import APIResponse
from backend.schemas.projects import ProjectCreate, ProjectResponse, RotateApiKeyResponse, ServiceResponse, UpdateProjectRequest
from backend.services.project_service import project_service

router = APIRouter(prefix="/projects", tags=["Projects & Services"])


@router.post("", response_model=APIResponse[ProjectResponse], status_code=status.HTTP_201_CREATED)
async def create_project(
    data: ProjectCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session)
):
    """Creates a new project within the user's organization."""
    project = await project_service.create_project(session, current_user.organization_id, data)
    return APIResponse(
        message="Project created successfully.",
        data=ProjectResponse.model_validate(project)
    )


@router.get("", response_model=APIResponse[List[ProjectResponse]])
async def list_projects(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session)
):
    """Lists all projects owned by the user's organization."""
    projects = await project_service.list_projects(session, current_user.organization_id)
    return APIResponse(
        message="Projects list retrieved.",
        data=[ProjectResponse.model_validate(p) for p in projects]
    )


@router.post("/{project_id}/api-keys", response_model=APIResponse[ApiKeyResponse], status_code=status.HTTP_201_CREATED)
async def create_api_key(
    project_id: uuid.UUID,
    data: ApiKeyCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session)
):
    """Generates a new SDK API key for high-throughput ingestion."""
    api_key, raw_key = await project_service.create_api_key(session, project_id, data)
    response_data = ApiKeyResponse.model_validate(api_key)
    response_data.raw_key = raw_key
    return APIResponse(
        message="SDK API Key generated. Copy the raw key now; it will not be displayed again.",
        data=response_data
    )


@router.get("/{project_id}/services", response_model=APIResponse[List[ServiceResponse]])
async def list_services(
    project_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session)
):
    """Lists all microservices auto-discovered under a project."""
    services = await project_service.list_services(session, project_id)
    return APIResponse(
        message="Services list retrieved.",
        data=[ServiceResponse.model_validate(s) for s in services]
    )


@router.put("/{project_id}", response_model=APIResponse[ProjectResponse])
async def update_project(
    project_id: uuid.UUID,
    data: UpdateProjectRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session)
):
    """Updates project details, logo, and settings."""
    project = await project_service.update_project(session, project_id, data)
    return APIResponse(
        message="Project updated successfully.",
        data=ProjectResponse.model_validate(project)
    )


@router.delete("/{project_id}", response_model=APIResponse[dict])
async def delete_project(
    project_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session)
):
    """Soft deletes a project."""
    await project_service.delete_project(session, project_id)
    return APIResponse(
        message="Project deleted successfully.",
        data={"deleted": True}
    )


@router.post("/{project_id}/archive", response_model=APIResponse[ProjectResponse])
async def archive_project(
    project_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session)
):
    """Archives a project."""
    project = await project_service.archive_project(session, project_id)
    return APIResponse(
        message="Project archived successfully.",
        data=ProjectResponse.model_validate(project)
    )


@router.post("/{project_id}/restore", response_model=APIResponse[ProjectResponse])
async def restore_project(
    project_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session)
):
    """Restores an archived project."""
    project = await project_service.restore_project(session, project_id)
    return APIResponse(
        message="Project restored successfully.",
        data=ProjectResponse.model_validate(project)
    )


@router.post("/{project_id}/api-keys/{key_id}/rotate", response_model=APIResponse[RotateApiKeyResponse])
async def rotate_api_key(
    project_id: uuid.UUID,
    key_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session)
):
    """Rotates an API key and returns a new raw key."""
    from datetime import datetime, timezone
    key, raw_key = await project_service.rotate_api_key(session, key_id)
    return APIResponse(
        message="API key rotated successfully. Store the new key safely.",
        data=RotateApiKeyResponse(
            id=key.id,
            name=key.name,
            prefix=key.prefix,
            environment=key.environment,
            new_raw_key=raw_key,
            rotated_at=datetime.now(timezone.utc)
        )
    )


@router.post("/{project_id}/api-keys/{key_id}/disable", response_model=APIResponse[dict])
async def disable_api_key(
    project_id: uuid.UUID,
    key_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session)
):
    """Disables an active API key."""
    await project_service.disable_api_key(session, key_id)
    return APIResponse(
        message="API key disabled successfully.",
        data={"disabled": True}
    )


@router.delete("/{project_id}/api-keys/{key_id}", response_model=APIResponse[dict])
async def delete_api_key(
    project_id: uuid.UUID,
    key_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session)
):
    """Deletes an API key."""
    await project_service.delete_api_key(session, key_id)
    return APIResponse(
        message="API key deleted successfully.",
        data={"deleted": True}
    )
