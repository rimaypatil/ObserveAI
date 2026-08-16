import uuid
from typing import Optional, Sequence
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from backend.models.projects import ApiKey, Deployment, Project, Service
from backend.repositories.base import BaseRepository


class ProjectRepository(BaseRepository[Project]):
    def __init__(self, session):
        super().__init__(Project, session)

    async def get_by_id_and_org(self, project_id: uuid.UUID, organization_id: uuid.UUID) -> Optional[Project]:
        query = select(Project).where(
            Project.id == project_id,
            Project.organization_id == organization_id,
            Project.is_deleted == False
        )
        result = await self.session.execute(query)
        return result.scalars().first()

    async def get_by_org_and_slug(self, organization_id: uuid.UUID, slug: str) -> Optional[Project]:
        query = select(Project).where(
            Project.organization_id == organization_id,
            Project.slug == slug,
            Project.is_deleted == False
        )
        result = await self.session.execute(query)
        return result.scalars().first()

    async def find_by_organization(self, organization_id: uuid.UUID) -> Sequence[Project]:
        query = select(Project).where(
            Project.organization_id == organization_id,
            Project.is_deleted == False
        ).order_by(Project.name.asc())
        result = await self.session.execute(query)
        return result.scalars().all()


class ApiKeyRepository(BaseRepository[ApiKey]):
    def __init__(self, session):
        super().__init__(ApiKey, session)

    async def get_by_key_hash(self, key_hash: str) -> Optional[ApiKey]:
        query = (
            select(ApiKey)
            .options(selectinload(ApiKey.project))
            .where(ApiKey.key_hash == key_hash, ApiKey.is_active == True, ApiKey.is_deleted == False)
        )
        result = await self.session.execute(query)
        return result.scalars().first()

    async def find_by_project(self, project_id: uuid.UUID) -> Sequence[ApiKey]:
        query = select(ApiKey).where(ApiKey.project_id == project_id, ApiKey.is_deleted == False).order_by(ApiKey.created_at.desc())
        result = await self.session.execute(query)
        return result.scalars().all()

    async def get_key_by_id_and_org(self, key_id: uuid.UUID, organization_id: uuid.UUID) -> Optional[ApiKey]:
        query = (
            select(ApiKey)
            .join(Project, ApiKey.project_id == Project.id)
            .where(
                ApiKey.id == key_id,
                Project.organization_id == organization_id,
                ApiKey.is_deleted == False,
                Project.is_deleted == False
            )
        )
        result = await self.session.execute(query)
        return result.scalars().first()


class ServiceRepository(BaseRepository[Service]):
    def __init__(self, session):
        super().__init__(Service, session)

    async def get_by_project_and_name(self, project_id: uuid.UUID, name: str) -> Optional[Service]:
        query = select(Service).where(
            Service.project_id == project_id,
            Service.name == name,
            Service.is_deleted == False
        )
        result = await self.session.execute(query)
        return result.scalars().first()

    async def find_by_project(self, project_id: uuid.UUID) -> Sequence[Service]:
        query = select(Service).where(
            Service.project_id == project_id,
            Service.is_deleted == False
        ).order_by(Service.name.asc())
        result = await self.session.execute(query)
        return result.scalars().all()


class DeploymentRepository(BaseRepository[Deployment]):
    def __init__(self, session):
        super().__init__(Deployment, session)

    async def get_latest_for_service(self, service_id: uuid.UUID) -> Optional[Deployment]:
        query = (
            select(Deployment)
            .where(Deployment.service_id == service_id, Deployment.is_deleted == False)
            .order_by(Deployment.deployed_at.desc())
            .limit(1)
        )
        result = await self.session.execute(query)
        return result.scalars().first()
