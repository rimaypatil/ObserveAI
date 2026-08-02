import uuid
from typing import List, Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from backend.models.projects import ApiKey, Project, Service
from backend.repositories.project_repository import ApiKeyRepository, ProjectRepository, ServiceRepository
from backend.schemas.auth import ApiKeyCreate, ApiKeyResponse
from backend.schemas.projects import ProjectCreate
from backend.utils.exceptions import NotFoundError, ValidationException
from backend.utils.security import generate_api_key, hash_api_key


class ProjectService:
    async def create_project(self, session: AsyncSession, organization_id: uuid.UUID, data: ProjectCreate) -> Project:
        project_repo = ProjectRepository(session)
        slug = data.name.lower().replace(" ", "-")
        
        existing = await project_repo.get_by_org_and_slug(organization_id, slug)
        if existing:
            slug = f"{slug}-{uuid.uuid4().hex[:4]}"

        project = Project(
            organization_id=organization_id,
            name=data.name,
            slug=slug,
            environment=data.environment,
            description=data.description
        )
        return await project_repo.create(project)

    async def list_projects(self, session: AsyncSession, organization_id: uuid.UUID) -> List[Project]:
        project_repo = ProjectRepository(session)
        return list(await project_repo.find_by_organization(organization_id))

    async def create_api_key(
        self,
        session: AsyncSession,
        project_id: uuid.UUID,
        data: ApiKeyCreate
    ) -> Tuple[ApiKey, str]:
        raw_key, hashed_key = generate_api_key(environment=data.environment)
        prefix = raw_key[:12]

        key_repo = ApiKeyRepository(session)
        api_key = ApiKey(
            project_id=project_id,
            name=data.name,
            key_hash=hashed_key,
            prefix=prefix,
            environment=data.environment,
            is_active=True
        )
        api_key = await key_repo.create(api_key)
        return api_key, raw_key

    async def list_services(self, session: AsyncSession, project_id: uuid.UUID) -> List[Service]:
        service_repo = ServiceRepository(session)
        return list(await service_repo.find_by_project(project_id))

    async def update_project(
        self, session: AsyncSession, project_id: uuid.UUID, data: Any
    ) -> Project:
        project_repo = ProjectRepository(session)
        project = await project_repo.get_by_id(project_id)
        if not project:
            raise NotFoundError("Project not found.")

        if data.name:
            project.name = data.name
        if data.environment:
            project.environment = data.environment
        if data.description is not None:
            project.description = data.description
        if getattr(data, "logo_url", None) is not None:
            project.logo_url = data.logo_url
        if getattr(data, "settings", None) is not None:
            project.settings = data.settings

        await session.flush()
        return project

    async def delete_project(self, session: AsyncSession, project_id: uuid.UUID) -> bool:
        project_repo = ProjectRepository(session)
        return await project_repo.soft_delete(project_id)

    async def archive_project(self, session: AsyncSession, project_id: uuid.UUID) -> Project:
        from datetime import datetime, timezone
        project_repo = ProjectRepository(session)
        project = await project_repo.get_by_id(project_id)
        if not project:
            raise NotFoundError("Project not found.")

        project.is_archived = True
        project.archived_at = datetime.now(timezone.utc)
        await session.flush()
        return project

    async def restore_project(self, session: AsyncSession, project_id: uuid.UUID) -> Project:
        project_repo = ProjectRepository(session)
        project = await project_repo.get_by_id(project_id)
        if not project:
            raise NotFoundError("Project not found.")

        project.is_archived = False
        project.archived_at = None
        await session.flush()
        return project

    async def rotate_api_key(self, session: AsyncSession, key_id: uuid.UUID) -> Tuple[ApiKey, str]:
        key_repo = ApiKeyRepository(session)
        key = await key_repo.get_by_id(key_id)
        if not key:
            raise NotFoundError("API Key not found.")

        raw_key, hashed_key = generate_api_key(environment=key.environment)
        key.key_hash = hashed_key
        key.prefix = raw_key[:12]
        await session.flush()
        return key, raw_key

    async def disable_api_key(self, session: AsyncSession, key_id: uuid.UUID) -> ApiKey:
        key_repo = ApiKeyRepository(session)
        key = await key_repo.get_by_id(key_id)
        if not key:
            raise NotFoundError("API Key not found.")

        key.is_active = False
        await session.flush()
        return key

    async def delete_api_key(self, session: AsyncSession, key_id: uuid.UUID) -> bool:
        key_repo = ApiKeyRepository(session)
        return await key_repo.soft_delete(key_id)


project_service = ProjectService()

