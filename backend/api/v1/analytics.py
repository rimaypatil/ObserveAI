import uuid
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from backend.api.dependencies import get_current_user
from backend.database.session import get_async_session
from backend.models.users import User
from backend.schemas.analytics import OverviewStatsResponse
from backend.schemas.common import APIResponse
from backend.services.analytics_service import analytics_service

router = APIRouter(prefix="/analytics", tags=["Dashboard Analytics"])


@router.get("/overview", response_model=APIResponse[OverviewStatsResponse])
async def get_overview_stats(
    project_id: uuid.UUID = Query(...),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session)
):
    """Retrieves high-level platform statistics, active incidents, service health, and AI RCA resolution rates."""
    stats = await analytics_service.get_overview_stats(session, project_id, current_user.organization_id)
    return APIResponse(
        message="Analytics overview stats retrieved.",
        data=stats
    )
