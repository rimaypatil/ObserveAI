import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class OrganizationMemberResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: uuid.UUID
    email: EmailStr
    full_name: str
    role: str
    created_at: datetime
    assigned_project_ids: List[uuid.UUID] = []


class InviteMemberRequest(BaseModel):
    email: EmailStr
    full_name: str = Field(..., min_length=2)
    password: str = Field(..., min_length=8)
    role: str = "MEMBER"
    assigned_project_ids: Optional[List[uuid.UUID]] = None


class UpdateMemberRoleRequest(BaseModel):
    role: str
    assigned_project_ids: Optional[List[uuid.UUID]] = None


class TransferOwnershipRequest(BaseModel):
    new_owner_id: uuid.UUID


class OrganizationDetailsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    slug: str
    plan: str
    created_at: datetime
    total_members: int = 1
    total_projects: int = 0
