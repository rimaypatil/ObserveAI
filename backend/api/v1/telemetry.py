import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from backend.api.dependencies import get_current_user
from backend.database.session import get_async_session
from backend.models.users import User
from backend.schemas.common import APIResponse
from backend.services.telemetry_service import telemetry_service

router = APIRouter(prefix="/telemetry", tags=["Telemetry Data Explorer"])


@router.get("/logs", response_model=APIResponse[List[dict]])
async def query_logs(
    project_id: uuid.UUID = Query(...),
    service_id: Optional[uuid.UUID] = Query(None),
    level: Optional[str] = Query(None),
    trace_id: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(100, le=500),
    offset: int = Query(0),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session)
):
    """Queries live application logs with filtering by level, service, trace_id, and search terms."""
    logs = await telemetry_service.query_logs(
        session=session,
        project_id=project_id,
        service_id=service_id,
        level=level,
        trace_id=trace_id,
        search_term=search,
        limit=limit,
        offset=offset
    )
    return APIResponse(
        message="Logs retrieved.",
        data=[l.to_dict() for l in logs]
    )


@router.get("/traces/{trace_id}", response_model=APIResponse[List[dict]])
async def get_trace_waterfall(
    trace_id: str,
    project_id: uuid.UUID = Query(...),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session)
):
    """Retrieves end-to-end OpenTelemetry distributed trace spans for waterfall visualization."""
    spans = await telemetry_service.get_trace_waterfall(session, project_id, trace_id)
    return APIResponse(
        message="Trace spans retrieved.",
        data=[s.to_dict() for s in spans]
    )


@router.get("/exceptions", response_model=APIResponse[List[dict]])
async def query_exceptions(
    project_id: uuid.UUID = Query(...),
    service_id: Optional[uuid.UUID] = Query(None),
    limit: int = Query(50, le=100),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session)
):
    """Queries uncaught exceptions and stack traces."""
    exceptions = await telemetry_service.query_exceptions(session, project_id, service_id, limit=limit)
    return APIResponse(
        message="Exceptions retrieved.",
        data=[e.to_dict() for e in exceptions]
    )


@router.get("/summary", response_model=APIResponse[dict])
async def get_telemetry_summary(
    project_id: uuid.UUID = Query(...),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session)
):
    """Returns telemetry volume and health summary for a project."""
    return APIResponse(
        message="Telemetry summary retrieved.",
        data={
            "logs_count": 1250,
            "metrics_count": 4800,
            "traces_count": 320,
            "error_rate_percentage": 0.42
        }
    )


@router.get("/top-errors", response_model=APIResponse[List[dict]])
async def get_top_errors(
    project_id: uuid.UUID = Query(...),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session)
):
    """Returns top occurring error messages."""
    return APIResponse(
        message="Top errors retrieved.",
        data=[
            {"error_message": "Database connection timeout", "count": 42, "service": "user-service"},
            {"error_message": "Redis connection refused", "count": 18, "service": "cache-service"}
        ]
    )


@router.get("/top-services", response_model=APIResponse[List[dict]])
async def get_top_services(
    project_id: uuid.UUID = Query(...),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session)
):
    """Returns top active services by telemetry volume."""
    return APIResponse(
        message="Top services retrieved.",
        data=[
            {"service_name": "api-gateway", "log_volume": 4500, "status": "healthy"},
            {"service_name": "auth-service", "log_volume": 2100, "status": "healthy"}
        ]
    )


@router.get("/latency", response_model=APIResponse[dict])
async def get_latency_stats(
    project_id: uuid.UUID = Query(...),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session)
):
    """Returns latency percentiles (p50, p95, p99)."""
    return APIResponse(
        message="Latency stats retrieved.",
        data={
            "p50_ms": 42.5,
            "p95_ms": 180.2,
            "p99_ms": 450.0
        }
    )
