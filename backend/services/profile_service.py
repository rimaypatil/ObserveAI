import uuid
from typing import Any, Dict, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from backend.models.users import User
from backend.repositories.user_repository import UserRepository
from backend.schemas.profile import ChangePasswordRequest, UpdateProfileRequest
from backend.utils.exceptions import NotFoundError, ValidationException
from backend.utils.security import hash_password, verify_password


class ProfileService:
    async def get_profile(self, session: AsyncSession, user_id: uuid.UUID) -> User:
        user_repo = UserRepository(session)
        user = await user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundError("User", user_id)
        return user

    async def update_profile(self, session: AsyncSession, user_id: uuid.UUID, data: UpdateProfileRequest) -> User:
        user_repo = UserRepository(session)
        user = await user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundError("User", user_id)

        if data.full_name is not None:
            user.full_name = data.full_name
        if data.avatar_url is not None:
            user.avatar_url = data.avatar_url
        if data.timezone is not None:
            user.timezone = data.timezone
        if data.notification_preferences is not None:
            user.notification_preferences = data.notification_preferences

        await session.flush()
        return user

    async def change_password(self, session: AsyncSession, user_id: uuid.UUID, data: ChangePasswordRequest) -> bool:
        user_repo = UserRepository(session)
        user = await user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundError("User", user_id)

        if not verify_password(data.current_password, user.password_hash):
            raise ValidationException("Current password is incorrect.")

        user.password_hash = hash_password(data.new_password)
        await session.flush()
        return True


profile_service = ProfileService()
