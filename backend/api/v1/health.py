from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from backend.database.session import get_async_session
from backend.services.health_service import health_service

router = APIRouter(tags=["System Health & Liveness"])


@router.get("/health")
async def health_check(session: AsyncSession = Depends(get_async_session)):
    """Full system component health check (Database, Redis, RabbitMQ, ChromaDB, Gemini)."""
    return await health_service.check_health(session)


@router.get("/ready")
async def readiness_check():
    """Kubernetes readiness probe endpoint."""
    return {"status": "ready"}


@router.get("/live")
async def liveness_check():
    """Kubernetes liveness probe endpoint."""
    return {"status": "live"}
