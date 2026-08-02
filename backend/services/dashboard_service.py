import uuid
from typing import Any, Dict, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from backend.repositories.dashboard_repository import DashboardRepository


class DashboardService:
    async def get_overview(self, session: AsyncSession, organization_id: Optional[uuid.UUID] = None) -> Dict[str, Any]:
        repo = DashboardRepository(session)
        return await repo.get_overview_stats(organization_id=organization_id)


dashboard_service = DashboardService()
