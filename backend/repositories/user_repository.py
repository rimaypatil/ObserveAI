import uuid
from typing import Optional, Sequence
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from backend.models.users import Organization, User, UserSession
from backend.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    def __init__(self, session):
        super().__init__(User, session)

    async def get_by_email(self, email: str) -> Optional[User]:
        query = select(User).where(User.email == email, User.is_deleted == False)
        result = await self.session.execute(query)
        return result.scalars().first()

    async def get_with_organization(self, user_id: uuid.UUID) -> Optional[User]:
        query = (
            select(User)
            .options(selectinload(User.organization))
            .where(User.id == user_id, User.is_deleted == False)
        )
        result = await self.session.execute(query)
        return result.scalars().first()

    async def get_by_reset_token(self, token_hash: str) -> Optional[User]:
        query = select(User).where(User.password_reset_token == token_hash, User.is_deleted == False)
        result = await self.session.execute(query)
        return result.scalars().first()


class OrganizationRepository(BaseRepository[Organization]):
    def __init__(self, session):
        super().__init__(Organization, session)

    async def get_by_slug(self, slug: str) -> Optional[Organization]:
        query = select(Organization).where(Organization.slug == slug, Organization.is_deleted == False)
        result = await self.session.execute(query)
        return result.scalars().first()


class SessionRepository(BaseRepository[UserSession]):
    def __init__(self, session):
        super().__init__(UserSession, session)

    async def get_by_token_hash(self, token_hash: str) -> Optional[UserSession]:
        query = select(UserSession).where(UserSession.token_hash == token_hash, UserSession.is_deleted == False)
        result = await self.session.execute(query)
        return result.scalars().first()
