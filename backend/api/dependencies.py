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
    user = await user_repo.get_by_id(uuid.UUID(user_id_str))
    if not user or not user.is_active:
        raise AuthenticationError("User not found or deactivated.")

    return user


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
