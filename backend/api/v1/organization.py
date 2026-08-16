import uuid
from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from backend.api.dependencies import get_current_user, require_owner
from backend.database.session import get_async_session
from backend.models.users import User
from backend.schemas.common import APIResponse
from backend.schemas.organization import (
    InviteMemberRequest,
    OrganizationDetailsResponse,
    OrganizationMemberResponse,
    TransferOwnershipRequest,
    UpdateMemberRoleRequest,
)
from backend.services.organization_service import organization_service
from backend.repositories.project_repository import ProjectRepository
from backend.repositories.user_repository import UserRepository

router = APIRouter(prefix="/organization", tags=["Organization & Account Management"])


@router.get("/me", response_model=APIResponse[OrganizationDetailsResponse])
async def get_my_organization(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session)
):
    """Retrieves current user's organization metadata."""
    org = await organization_service.get_organization(session, current_user.organization_id)
    user_repo = UserRepository(session)
    proj_repo = ProjectRepository(session)
    
    members_count = await user_repo.count_by_organization(org.id)
    projects = await proj_repo.find_by_organization(org.id)

    data = OrganizationDetailsResponse(
        id=org.id,
        name=org.name,
        slug=org.slug,
        plan=org.plan,
        created_at=org.created_at,
        total_members=members_count,
        total_projects=len(projects)
    )
    return APIResponse(message="Organization details retrieved.", data=data)


@router.get("/members", response_model=APIResponse[List[OrganizationMemberResponse]])
async def list_members(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session)
):
    """Lists all members belonging to the organization."""
    members = await organization_service.list_members(session, current_user.organization_id)
    return APIResponse(
        message="Organization members retrieved.",
        data=[OrganizationMemberResponse.model_validate(m) for m in members]
    )


@router.post("/members", response_model=APIResponse[OrganizationMemberResponse], status_code=status.HTTP_201_CREATED)
async def invite_member(
    data: InviteMemberRequest,
    current_owner: User = Depends(require_owner),
    session: AsyncSession = Depends(get_async_session)
):
    """Invites a new member to the organization (Owner only)."""
    member = await organization_service.invite_member(session, current_owner, data)
    return APIResponse(
        message="Organization member added successfully.",
        data=OrganizationMemberResponse.model_validate(member)
    )


@router.put("/members/{user_id}/role", response_model=APIResponse[OrganizationMemberResponse])
async def update_member_role(
    user_id: uuid.UUID,
    data: UpdateMemberRoleRequest,
    current_owner: User = Depends(require_owner),
    session: AsyncSession = Depends(get_async_session)
):
    """Updates role or project assignments for an organization member (Owner only)."""
    member = await organization_service.update_member_role(session, current_owner, user_id, data)
    return APIResponse(
        message="Member role updated successfully.",
        data=OrganizationMemberResponse.model_validate(member)
    )


@router.delete("/members/{user_id}", response_model=APIResponse[dict])
async def remove_member(
    user_id: uuid.UUID,
    current_owner: User = Depends(require_owner),
    session: AsyncSession = Depends(get_async_session)
):
    """Removes a member from the organization (Owner only)."""
    await organization_service.remove_member(session, current_owner, user_id)
    return APIResponse(
        message="Member removed from organization.",
        data={"removed": True}
    )


@router.post("/transfer-ownership", response_model=APIResponse[dict])
async def transfer_ownership(
    data: TransferOwnershipRequest,
    current_owner: User = Depends(require_owner),
    session: AsyncSession = Depends(get_async_session)
):
    """Transfers organization ownership to another existing member (Owner only)."""
    result = await organization_service.transfer_ownership(session, current_owner, data.new_owner_id)
    return APIResponse(
        message=result["message"],
        data=result
    )


@router.delete("", response_model=APIResponse[dict])
async def delete_organization(
    current_owner: User = Depends(require_owner),
    session: AsyncSession = Depends(get_async_session)
):
    """Deletes the organization and all organization data (Owner only, when sole member)."""
    result = await organization_service.delete_organization(session, current_owner)
    return APIResponse(
        message=result["message"],
        data=result
    )
