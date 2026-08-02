from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from backend.api.dependencies import get_current_user
from backend.database.session import get_async_session
from backend.models.users import User
from backend.schemas.common import APIResponse
from backend.schemas.profile import ChangePasswordRequest, ProfileResponse, UpdateProfileRequest
from backend.services.profile_service import profile_service

router = APIRouter(prefix="/profile", tags=["User Profile"])


@router.get("", response_model=APIResponse[ProfileResponse])
async def get_profile(
    current_user: User = Depends(get_current_user)
):
    """Retrieves authenticated user profile details."""
    return APIResponse(
        message="Profile retrieved.",
        data=ProfileResponse.model_validate(current_user)
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
        data=ProfileResponse.model_validate(updated_user)
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
