from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from backend.api.dependencies import get_current_user
from backend.database.session import get_async_session
from backend.models.users import User
from backend.schemas.auth import ForgotPasswordRequest, LoginRequest, ResetPasswordRequest, TokenResponse, UserCreate, UserResponse
from backend.schemas.common import APIResponse
from backend.services.auth_service import auth_service

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=APIResponse[UserResponse], status_code=status.HTTP_201_CREATED)
async def register(
    data: UserCreate,
    session: AsyncSession = Depends(get_async_session)
):
    """Registers a new user and bootstraps their organization."""
    user = await auth_service.register_user(session, data)
    return APIResponse(
        message="User account registered successfully.",
        data=UserResponse.model_validate(user)
    )


@router.post("/login", response_model=APIResponse[TokenResponse])
async def login(
    data: LoginRequest,
    session: AsyncSession = Depends(get_async_session)
):
    """Authenticates user credentials and returns JWT bearer tokens."""
    tokens = await auth_service.authenticate_user(session, data)
    return APIResponse(
        message="Authentication successful.",
        data=tokens
    )


@router.get("/me", response_model=APIResponse[UserResponse])
async def get_me(
    current_user: User = Depends(get_current_user)
):
    """Returns currently authenticated user profile."""
    return APIResponse(
        message="User profile retrieved.",
        data=UserResponse.model_validate(current_user)
    )


@router.post("/forgot-password", response_model=APIResponse[dict])
async def forgot_password(
    data: ForgotPasswordRequest,
    session: AsyncSession = Depends(get_async_session)
):
    """Sends password reset token email."""
    await auth_service.forgot_password(session, data.email)
    return APIResponse(
        message="If the email exists, a password reset token has been sent.",
        data={"sent": True}
    )


@router.post("/reset-password", response_model=APIResponse[dict])
async def reset_password(
    data: ResetPasswordRequest,
    session: AsyncSession = Depends(get_async_session)
):
    """Resets user password using reset token."""
    await auth_service.reset_password(session, data.token, data.new_password)
    return APIResponse(
        message="Password has been reset successfully.",
        data={"reset": True}
    )
