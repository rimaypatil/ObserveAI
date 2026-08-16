import uuid
from typing import Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from backend.models.users import Organization, OrganizationMember, User
from backend.repositories.user_repository import OrganizationRepository, UserRepository
from backend.schemas.auth import LoginRequest, TokenResponse, UserCreate
from backend.utils.exceptions import AuthenticationError, ValidationException
from backend.utils.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    verify_password,
)

class AuthService:
    async def register_user(self, session: AsyncSession, data: UserCreate) -> User:
        user_repo = UserRepository(session)
        existing = await user_repo.get_by_email(data.email)
        if existing:
            raise ValidationException(f"User with email '{data.email}' already exists.")

        org_repo = OrganizationRepository(session)
        org_name = data.organization_name or f"{data.full_name}'s Org"
        slug = org_name.lower().replace(" ", "-") + "-" + uuid.uuid4().hex[:4]

        organization = Organization(
            name=org_name,
            slug=slug,
            plan="enterprise"
        )
        organization = await org_repo.create(organization)

        user = User(
            email=data.email,
            password_hash=hash_password(data.password),
            full_name=data.full_name,
            role="owner",
            organization_id=organization.id
        )
        user = await user_repo.create(user)

        org_member = OrganizationMember(
            organization_id=organization.id,
            user_id=user.id,
            role="owner"
        )
        session.add(org_member)
        await session.flush()

        user.organization = organization
        return user

    async def authenticate_user(self, session: AsyncSession, data: LoginRequest) -> TokenResponse:
        user_repo = UserRepository(session)
        user = await user_repo.get_by_email(data.email)
        if not user or not verify_password(data.password, user.password_hash):
            raise AuthenticationError("Invalid email or password.")

        if not user.is_active:
            raise AuthenticationError("User account is deactivated.")

        access_token = create_access_token(
            subject=str(user.id),
            extra_claims={"org_id": str(user.organization_id), "role": user.role}
        )
        refresh_token = create_refresh_token(subject=str(user.id))

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=86400
        )

    async def forgot_password(self, session: AsyncSession, email: str) -> bool:
        from datetime import datetime, timedelta, timezone
        from backend.notifications.notifier import notification_engine
        from backend.utils.security import generate_reset_token, hash_api_key

        user_repo = UserRepository(session)
        user = await user_repo.get_by_email(email)
        if not user:
            return True  # Avoid email enumeration

        raw_token, hashed_token = generate_reset_token()
        user.password_reset_token = hashed_token
        user.password_reset_expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
        await session.flush()

        notification_engine.send_password_reset_email(user.email, raw_token)
        return True

    async def reset_password(self, session: AsyncSession, token: str, new_password: str) -> bool:
        from datetime import datetime, timezone
        from backend.utils.security import hash_api_key

        hashed_token = hash_api_key(token)
        user_repo = UserRepository(session)
        user = await user_repo.get_by_reset_token(hashed_token)

        if not user or not user.password_reset_expires_at:
            raise ValidationException("Invalid or expired password reset token.")

        if user.password_reset_expires_at < datetime.now(timezone.utc):
            raise ValidationException("Password reset token has expired.")

        user.password_hash = hash_password(new_password)
        user.password_reset_token = None
        user.password_reset_expires_at = None
        await session.flush()
        return True


auth_service = AuthService()

