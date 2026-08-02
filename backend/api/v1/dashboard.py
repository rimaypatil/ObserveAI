from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from backend.api.dependencies import get_current_user
from backend.database.session import get_async_session
from backend.models.users import User
from backend.schemas.common import APIResponse
from backend.schemas.dashboard import DashboardOverviewResponse
from backend.services.dashboard_service import dashboard_service

router = APIRouter(prefix="/dashboard", tags=["Dashboard Analytics"])


@router.get("/overview", response_model=APIResponse[DashboardOverviewResponse])
async def get_dashboard_overview(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session)
):
    """Retrieves consolidated dashboard analytics overview."""
    stats = await dashboard_service.get_overview(session, current_user.organization_id)
    return APIResponse(
        message="Dashboard overview stats retrieved.",
        data=DashboardOverviewResponse(**stats)
    )
