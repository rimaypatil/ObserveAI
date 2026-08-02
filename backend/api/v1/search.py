from typing import Optional
import uuid
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from backend.api.dependencies import get_current_user
from backend.database.session import get_async_session
from backend.models.users import User
from backend.schemas.common import APIResponse
from backend.schemas.search import SearchQuery, SearchResponse
from backend.services.search_service import search_service

router = APIRouter(prefix="/search", tags=["Global Search & Advanced Filtering"])


@router.get("", response_model=APIResponse[SearchResponse])
async def search(
    query: Optional[str] = Query(None),
    project_id: Optional[uuid.UUID] = Query(None),
    severity: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, le=100),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session)
):
    """Executes multi-entity search across incidents, knowledge documents, and projects."""
    params = SearchQuery(
        query=query,
        project_id=project_id,
        severity=severity,
        status=status,
        page=page,
        page_size=page_size
    )
    results = await search_service.search_all(session, params)
    return APIResponse(
        message="Search results retrieved.",
        data=results
    )
