import uuid
from typing import Any, Dict, Optional, Sequence
from sqlalchemy import select
from backend.models.system import AuditLog
from backend.repositories.base import BaseRepository


class AuditRepository(BaseRepository[AuditLog]):
    def __init__(self, session):
        super().__init__(AuditLog, session)

    async def log_action(
        self,
        action: str,
        resource: str,
        user_id: Optional[uuid.UUID] = None,
        organization_id: Optional[uuid.UUID] = None,
        project_id: Optional[uuid.UUID] = None,
        details: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None
    ) -> AuditLog:
        audit = AuditLog(
            action=action,
            resource=resource,
            user_id=user_id,
            organization_id=organization_id,
            project_id=project_id,
            details_json=details,
            ip_address=ip_address
        )
        self.session.add(audit)
        await self.session.flush()
        return audit

    async def get_recent_logs(self, limit: int = 100) -> Sequence[AuditLog]:
        query = select(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit)
        result = await self.session.execute(query)
        return result.scalars().all()
