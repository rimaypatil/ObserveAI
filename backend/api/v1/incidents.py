import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from backend.api.dependencies import get_current_user
from backend.database.session import get_async_session
from backend.models.users import User
from backend.schemas.common import APIResponse
from backend.schemas.incidents import (
    AssignIncidentRequest,
    IncidentCommentCreate,
    IncidentCommentResponse,
    IncidentDetailResponse,
    IncidentResponse,
    IncidentUpdateStatusSchema,
)
from backend.services.incident_service import incident_service

router = APIRouter(prefix="/incidents", tags=["Autonomous Incident Management & AI RCA"])


@router.get("", response_model=APIResponse[List[IncidentResponse]])
async def list_incidents(
    project_id: uuid.UUID = Query(...),
    status: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    service_id: Optional[uuid.UUID] = Query(None),
    limit: int = Query(50, le=100),
    offset: int = Query(0),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session)
):
    """Lists incidents with severity, status, and service filters."""
    incidents = await incident_service.list_incidents(
        session=session,
        project_id=project_id,
        organization_id=current_user.organization_id,
        status=status,
        severity=severity,
        service_id=service_id,
        limit=limit,
        offset=offset
    )
    return APIResponse(
        message="Incidents list retrieved.",
        data=[IncidentResponse.model_validate(i) for i in incidents]
    )


@router.get("/{incident_id}", response_model=APIResponse[IncidentDetailResponse])
async def get_incident_details(
    incident_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session)
):
    """Retrieves full incident details, timeline event history, and AI Root Cause Analysis (RCA) report."""
    incident = await incident_service.get_incident_details(session, incident_id, current_user.organization_id)
    return APIResponse(
        message="Incident details and AI RCA report retrieved.",
        data=IncidentDetailResponse.model_validate(incident)
    )


@router.patch("/{incident_id}/status", response_model=APIResponse[IncidentResponse])
async def update_incident_status(
    incident_id: uuid.UUID,
    data: IncidentUpdateStatusSchema,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session)
):
    """Updates incident resolution status and summary."""
    updated = await incident_service.update_incident_status(
        session=session,
        incident_id=incident_id,
        organization_id=current_user.organization_id,
        new_status=data.status,
        summary=data.root_cause_summary
    )
    return APIResponse(
        message=f"Incident status updated to {data.status}.",
        data=IncidentResponse.model_validate(updated)
    )


@router.post("/{incident_id}/assign", response_model=APIResponse[IncidentResponse])
async def assign_incident(
    incident_id: uuid.UUID,
    data: AssignIncidentRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session)
):
    """Assigns an incident to a user."""
    updated = await incident_service.assign_incident(session, incident_id, current_user.organization_id, data.assigned_to_id)
    return APIResponse(
        message="Incident assigned successfully.",
        data=IncidentResponse.model_validate(updated)
    )


@router.post("/{incident_id}/comments", response_model=APIResponse[IncidentCommentResponse])
async def add_incident_comment(
    incident_id: uuid.UUID,
    data: IncidentCommentCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session)
):
    """Adds a comment to an incident timeline."""
    comment = await incident_service.add_comment(session, incident_id, current_user.organization_id, current_user.id, data.comment)
    return APIResponse(
        message="Comment added successfully.",
        data=IncidentCommentResponse.model_validate(comment)
    )
