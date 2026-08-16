import uuid
from typing import AsyncGenerator, Optional
from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database.session import get_async_session
from backend.models.projects import Project
from backend.models.users import User
from backend.repositories.project_repository import ApiKeyRepository
from backend.repositories.user_repository import UserRepository
from backend.utils.exceptions import AuthenticationError, AuthorizationError, NotFoundError
from backend.utils.security import decode_token, hash_api_key

security_bearer = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
    session: AsyncSession = Depends(get_async_session)
) -> User:
    """Dependency enforcing JWT Bearer token authentication."""
    if not credentials or not credentials.credentials:
        raise AuthenticationError("Authorization header missing or invalid format.")

    payload = decode_token(credentials.credentials)
    user_id_str = payload.get("sub")
    if not user_id_str:
        raise AuthenticationError("Token contains no subject claims.")

    user_repo = UserRepository(session)
    user = await user_repo.get_with_organization(uuid.UUID(user_id_str))
    if not user or not user.is_active:
        raise AuthenticationError("User not found or deactivated.")

    return user


async def require_owner(
    current_user: User = Depends(get_current_user)
) -> User:
    """Dependency enforcing OWNER role for organization administrative actions."""
    if not current_user.role or current_user.role.lower() != "owner":
        raise AuthorizationError("Only organization owners are authorized to perform this operation.")
    return current_user


async def get_current_project_by_api_key(
    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
    session: AsyncSession = Depends(get_async_session)
) -> Project:
    """Dependency enforcing SDK API key authentication for ingestion endpoints."""
    if not x_api_key:
        raise AuthenticationError("X-API-Key header required for SDK authentication.")

    key_hash = hash_api_key(x_api_key)
    key_repo = ApiKeyRepository(session)
    api_key_record = await key_repo.get_by_key_hash(key_hash)

    if not api_key_record or not api_key_record.is_active:
        raise AuthenticationError("Invalid or revoked SDK API Key.")

    return api_key_record.project


async def verify_project_ownership(
    session: AsyncSession,
    project_id: uuid.UUID,
    organization_id: uuid.UUID
) -> Project:
    """Verifies that a project exists and belongs to the specified organization."""
    from backend.repositories.project_repository import ProjectRepository
    project_repo = ProjectRepository(session)
    project = await project_repo.get_by_id_and_org(project_id, organization_id)
    if not project:
        raise NotFoundError("Project", project_id)
    return project


async def verify_incident_ownership(
    session: AsyncSession,
    incident_id: uuid.UUID,
    organization_id: uuid.UUID
):
    """Verifies that an incident exists and belongs to the specified organization."""
    from backend.repositories.incident_repository import IncidentRepository
    incident_repo = IncidentRepository(session)
    incident = await incident_repo.get_with_details_and_org(incident_id, organization_id)
    if not incident:
        raise NotFoundError("Incident", incident_id)
    return incident


async def verify_api_key_ownership(
    session: AsyncSession,
    key_id: uuid.UUID,
    organization_id: uuid.UUID
):
    """Verifies that an API key exists and belongs to a project in the specified organization."""
    key_repo = ApiKeyRepository(session)
    key = await key_repo.get_key_by_id_and_org(key_id, organization_id)
    if not key:
        raise NotFoundError("API Key", key_id)
    return key

