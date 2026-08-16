import uuid
from typing import List, Optional
from sqlalchemy import select, delete, func
from sqlalchemy.ext.asyncio import AsyncSession
from backend.models.projects import Project, ProjectMember
from backend.models.users import Organization, OrganizationMember, User
from backend.repositories.user_repository import OrganizationRepository, UserRepository
from backend.schemas.organization import InviteMemberRequest, UpdateMemberRoleRequest
from backend.utils.exceptions import NotFoundError, ValidationException, AuthorizationError
from backend.utils.security import hash_password


class OrganizationService:
    async def get_organization(self, session: AsyncSession, org_id: uuid.UUID) -> Organization:
        org_repo = OrganizationRepository(session)
        org = await org_repo.get_by_id(org_id)
        if not org or org.is_deleted:
            raise NotFoundError("Organization", org_id)
        return org

    async def list_members(self, session: AsyncSession, organization_id: uuid.UUID) -> List[dict]:
        user_repo = UserRepository(session)
        users = await user_repo.find_by_organization(organization_id)

        result = []
        for user in users:
            # Query assigned project IDs for this member
            stmt = select(ProjectMember.project_id).where(ProjectMember.user_id == user.id)
            proj_res = await session.execute(stmt)
            assigned_project_ids = list(proj_res.scalars().all())

            role_formatted = user.role.upper() if user.role else "MEMBER"
            result.append({
                "user_id": user.id,
                "email": user.email,
                "full_name": user.full_name,
                "role": role_formatted,
                "created_at": user.created_at,
                "assigned_project_ids": assigned_project_ids,
            })
        return result

    async def invite_member(
        self, session: AsyncSession, current_user: User, data: InviteMemberRequest
    ) -> dict:
        if current_user.role.lower() != "owner":
            raise AuthorizationError("Only organization owners can invite members.")

        user_repo = UserRepository(session)
        existing = await user_repo.get_by_email(data.email)
        if existing:
            raise ValidationException(f"User with email '{data.email}' already exists.")

        assigned_role = data.role.lower()
        if assigned_role not in ["owner", "member"]:
            assigned_role = "member"

        new_user = User(
            email=data.email,
            password_hash=hash_password(data.password),
            full_name=data.full_name,
            role=assigned_role,
            organization_id=current_user.organization_id,
        )
        new_user = await user_repo.create(new_user)

        org_member = OrganizationMember(
            organization_id=current_user.organization_id,
            user_id=new_user.id,
            role=assigned_role,
        )
        session.add(org_member)

        # Assign projects if provided
        assigned_ids = []
        if data.assigned_project_ids:
            for pid in data.assigned_project_ids:
                pm = ProjectMember(project_id=pid, user_id=new_user.id)
                session.add(pm)
                assigned_ids.append(pid)

        await session.flush()

        return {
            "user_id": new_user.id,
            "email": new_user.email,
            "full_name": new_user.full_name,
            "role": new_user.role.upper(),
            "created_at": new_user.created_at,
            "assigned_project_ids": assigned_ids,
        }

    async def update_member_role(
        self, session: AsyncSession, current_user: User, member_user_id: uuid.UUID, data: UpdateMemberRoleRequest
    ) -> dict:
        if current_user.role.lower() != "owner":
            raise AuthorizationError("Only organization owners can manage member roles.")

        user_repo = UserRepository(session)
        target_user = await user_repo.get_by_id(member_user_id)
        if not target_user or target_user.is_deleted or target_user.organization_id != current_user.organization_id:
            raise NotFoundError("Organization member not found.")

        new_role = data.role.lower()
        if new_role not in ["owner", "member"]:
            raise ValidationException("Role must be OWNER or MEMBER.")

        # Prevent demoting the sole owner
        if target_user.role.lower() == "owner" and new_role == "member":
            owners_stmt = select(func.count(User.id)).where(
                User.organization_id == current_user.organization_id,
                User.role == "owner",
                User.is_deleted == False
            )
            owners_count = (await session.execute(owners_stmt)).scalar() or 0
            if owners_count <= 1:
                raise ValidationException("Cannot demote the sole organization owner. Transfer ownership first.")

        target_user.role = new_role

        # Update OrganizationMember table if exists
        om_stmt = select(OrganizationMember).where(
            OrganizationMember.organization_id == current_user.organization_id,
            OrganizationMember.user_id == target_user.id
        )
        om_res = await session.execute(om_stmt)
        om = om_res.scalars().first()
        if om:
            om.role = new_role

        # Update assigned projects if specified
        assigned_ids = []
        if data.assigned_project_ids is not None:
            await session.execute(delete(ProjectMember).where(ProjectMember.user_id == target_user.id))
            for pid in data.assigned_project_ids:
                pm = ProjectMember(project_id=pid, user_id=target_user.id)
                session.add(pm)
                assigned_ids.append(pid)
        else:
            stmt = select(ProjectMember.project_id).where(ProjectMember.user_id == target_user.id)
            res = await session.execute(stmt)
            assigned_ids = list(res.scalars().all())

        await session.flush()

        return {
            "user_id": target_user.id,
            "email": target_user.email,
            "full_name": target_user.full_name,
            "role": target_user.role.upper(),
            "created_at": target_user.created_at,
            "assigned_project_ids": assigned_ids,
        }

    async def remove_member(self, session: AsyncSession, current_user: User, member_user_id: uuid.UUID) -> bool:
        if current_user.role.lower() != "owner":
            raise AuthorizationError("Only organization owners can remove members.")

        if member_user_id == current_user.id:
            raise ValidationException("Cannot remove yourself using member removal. Use account deletion or transfer ownership.")

        user_repo = UserRepository(session)
        target_user = await user_repo.get_by_id(member_user_id)
        if not target_user or target_user.is_deleted or target_user.organization_id != current_user.organization_id:
            raise NotFoundError("Organization member not found.")

        target_user.soft_delete()
        await session.execute(delete(OrganizationMember).where(OrganizationMember.user_id == member_user_id))
        await session.execute(delete(ProjectMember).where(ProjectMember.user_id == member_user_id))
        await session.flush()
        return True

    async def transfer_ownership(
        self, session: AsyncSession, current_user: User, new_owner_id: uuid.UUID
    ) -> dict:
        if current_user.role.lower() != "owner":
            raise AuthorizationError("Only organization owners can transfer ownership.")

        if current_user.id == new_owner_id:
            raise ValidationException("You are already the organization owner.")

        user_repo = UserRepository(session)
        target_user = await user_repo.get_by_id(new_owner_id)
        if not target_user or target_user.is_deleted or target_user.organization_id != current_user.organization_id:
            raise NotFoundError("Target member not found in this organization.")

        # Update roles atomically
        current_user.role = "member"
        target_user.role = "owner"

        # Update OrganizationMember records
        om_stmt = select(OrganizationMember).where(
            OrganizationMember.organization_id == current_user.organization_id,
            OrganizationMember.user_id.in_([current_user.id, target_user.id])
        )
        om_res = await session.execute(om_stmt)
        for om in om_res.scalars().all():
            if om.user_id == current_user.id:
                om.role = "member"
            elif om.user_id == target_user.id:
                om.role = "owner"

        await session.flush()
        return {
            "transferred": True,
            "previous_owner_id": str(current_user.id),
            "new_owner_id": str(target_user.id),
            "message": f"Ownership successfully transferred to {target_user.full_name}."
        }

    async def delete_organization(self, session: AsyncSession, current_user: User) -> dict:
        if current_user.role.lower() != "owner":
            raise AuthorizationError("Only organization owners can delete the organization.")

        # Check total active members
        user_repo = UserRepository(session)
        total_members = await user_repo.count_by_organization(current_user.organization_id)
        if total_members > 1:
            raise ValidationException(
                "Other organization members exist. You must transfer ownership or remove all members before deleting the organization."
            )

        org_repo = OrganizationRepository(session)
        org = await org_repo.get_by_id(current_user.organization_id)
        if org:
            org.soft_delete()

        # Soft delete owner
        current_user.soft_delete()

        # Soft delete projects under org
        projects_stmt = select(Project).where(Project.organization_id == current_user.organization_id)
        projects_res = await session.execute(projects_stmt)
        for p in projects_res.scalars().all():
            p.soft_delete()

        await session.flush()
        return {
            "deleted": True,
            "message": "Organization and associated data deleted successfully."
        }

    async def delete_account(self, session: AsyncSession, current_user: User) -> dict:
        if current_user.role.lower() == "owner":
            user_repo = UserRepository(session)
            total_members = await user_repo.count_by_organization(current_user.organization_id)
            if total_members > 1:
                raise ValidationException(
                    "You are the organization owner and other members exist. Please transfer ownership to another member before deleting your account."
                )
            # Sole member owner: delete org as well
            return await self.delete_organization(session, current_user)

        # Member user: allow direct account deletion
        current_user.soft_delete()
        await session.execute(delete(OrganizationMember).where(OrganizationMember.user_id == current_user.id))
        await session.execute(delete(ProjectMember).where(ProjectMember.user_id == current_user.id))
        await session.flush()
        return {
            "deleted": True,
            "message": "Your account has been deleted successfully."
        }


organization_service = OrganizationService()
