from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from backend.api.dependencies import get_current_user
from backend.database.session import get_async_session
from backend.models.users import User
from backend.schemas.common import APIResponse
from backend.schemas.profile import ChangePasswordRequest, ProfileResponse, UpdateProfileRequest
from backend.services.profile_service import profile_service
from backend.services.organization_service import organization_service

router = APIRouter(prefix="/profile", tags=["User Profile"])


def build_profile_response(user: User) -> ProfileResponse:
    org_name = user.organization.name if getattr(user, "organization", None) else None
    role_str = user.role.upper() if user.role else "MEMBER"
    return ProfileResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=role_str,
        organization_id=user.organization_id,
        organization_name=org_name,
        avatar_url=user.avatar_url,
        timezone=getattr(user, "timezone", "UTC") or "UTC",
        notification_preferences=user.notification_preferences,
        created_at=user.created_at,
    )


@router.get("", response_model=APIResponse[ProfileResponse])
async def get_profile(
    current_user: User = Depends(get_current_user)
):
    """Retrieves authenticated user profile details."""
    return APIResponse(
        message="Profile retrieved.",
        data=build_profile_response(current_user)
    )


@router.put("", response_model=APIResponse[ProfileResponse])
async def update_profile(
    data: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session)
):
    """Updates user profile details, avatar URL, and notification preferences."""
    updated_user = await profile_service.update_profile(session, current_user.id, data)
    return APIResponse(
        message="Profile updated successfully.",
        data=build_profile_response(updated_user)
    )


@router.post("/change-password", response_model=APIResponse[dict])
async def change_password(
    data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session)
):
    """Changes password for currently authenticated user."""
    await profile_service.change_password(session, current_user.id, data)
    return APIResponse(
        message="Password changed successfully.",
        data={"changed": True}
    )


@router.delete("/account", response_model=APIResponse[dict])
async def delete_account(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session)
):
    """Deletes current user account (enforces ownership transfer rules if Owner)."""
    result = await organization_service.delete_account(session, current_user)
    return APIResponse(
        message=result["message"],
        data=result
    )
