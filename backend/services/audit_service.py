import uuid
from typing import Any, Dict, Optional, Sequence
from sqlalchemy.ext.asyncio import AsyncSession
from backend.models.system import AuditLog
from backend.repositories.audit_repository import AuditRepository


class AuditService:
    async def log_action(
        self,
        session: AsyncSession,
        action: str,
        resource: str,
        user_id: Optional[uuid.UUID] = None,
        organization_id: Optional[uuid.UUID] = None,
        project_id: Optional[uuid.UUID] = None,
        details: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None
    ) -> AuditLog:
        repo = AuditRepository(session)
        return await repo.log_action(
            action=action,
            resource=resource,
            user_id=user_id,
            organization_id=organization_id,
            project_id=project_id,
            details=details,
            ip_address=ip_address
        )

    async def get_logs(self, session: AsyncSession, limit: int = 100) -> Sequence[AuditLog]:
        repo = AuditRepository(session)
        return await repo.get_recent_logs(limit=limit)


audit_service = AuditService()
