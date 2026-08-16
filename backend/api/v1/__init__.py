from fastapi import APIRouter
from backend.api.v1.auth import router as auth_router
from backend.api.v1.projects import router as projects_router
from backend.api.v1.sdk import router as sdk_router
from backend.api.v1.telemetry import router as telemetry_router
from backend.api.v1.incidents import router as incidents_router
from backend.api.v1.knowledge import router as knowledge_router
from backend.api.v1.analytics import router as analytics_router
from backend.api.v1.profile import router as profile_router
from backend.api.v1.dashboard import router as dashboard_router
from backend.api.v1.search import router as search_router
from backend.api.v1.health import router as health_router
from backend.api.v1.feedback import router as feedback_router
from backend.api.v1.organization import router as organization_router

api_v1_router = APIRouter()
api_v1_router.include_router(auth_router)
api_v1_router.include_router(projects_router)
api_v1_router.include_router(organization_router)
api_v1_router.include_router(sdk_router)
api_v1_router.include_router(telemetry_router)
api_v1_router.include_router(incidents_router)
api_v1_router.include_router(knowledge_router)
api_v1_router.include_router(analytics_router)
api_v1_router.include_router(profile_router)
api_v1_router.include_router(dashboard_router)
api_v1_router.include_router(search_router)
api_v1_router.include_router(health_router)
api_v1_router.include_router(feedback_router)

__all__ = ["api_v1_router"]
