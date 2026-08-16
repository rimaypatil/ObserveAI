import uuid
import pytest
from backend.utils.security import generate_reset_token, hash_api_key, generate_api_key
from backend.schemas.auth import ForgotPasswordRequest, ResetPasswordRequest
from backend.schemas.profile import UpdateProfileRequest, ChangePasswordRequest
from backend.schemas.projects import UpdateProjectRequest, RotateApiKeyResponse
from backend.schemas.incidents import AssignIncidentRequest, IncidentCommentCreate
from backend.schemas.feedback import RCAFeedbackCreate


def test_password_reset_token_generation():
    raw_token, hashed_token = generate_reset_token()
    assert raw_token is not None
    assert len(raw_token) > 20
    assert hashed_token == hash_api_key(raw_token)


def test_api_key_rotation_token():
    raw_key, hashed_key = generate_api_key(environment="production")
    assert raw_key.startswith("obs_production_")
    assert len(hashed_key) == 64  # SHA-256 hex length


def test_profile_schemas():
    req = UpdateProfileRequest(full_name="John Doe", timezone="Asia/Kolkata")
    assert req.full_name == "John Doe"
    assert req.timezone == "Asia/Kolkata"

    pwd_req = ChangePasswordRequest(current_password="OldPassword123!", new_password="NewPassword123!")
    assert pwd_req.new_password == "NewPassword123!"


def test_project_update_schemas():
    req = UpdateProjectRequest(name="Updated Project", logo_url="https://example.com/logo.png")
    assert req.name == "Updated Project"
    assert req.logo_url == "https://example.com/logo.png"


def test_incident_assign_and_comment_schemas():
    user_id = uuid.uuid4()
    assign_req = AssignIncidentRequest(assigned_to_id=user_id)
    assert assign_req.assigned_to_id == user_id

    comment_req = IncidentCommentCreate(comment="Investigating high memory usage on auth pod.")
    assert comment_req.comment == "Investigating high memory usage on auth pod."


def test_feedback_schema():
    fb = RCAFeedbackCreate(is_helpful=True, rating=5, comment="Spot on analysis!")
    assert fb.is_helpful is True
    assert fb.rating == 5
    assert fb.comment == "Spot on analysis!"


def test_organization_schemas():
    from backend.schemas.organization import InviteMemberRequest, TransferOwnershipRequest, UpdateMemberRoleRequest
    invite = InviteMemberRequest(email="newuser@example.com", full_name="New User", password="Password123!", role="MEMBER")
    assert invite.email == "newuser@example.com"
    assert invite.role == "MEMBER"

    target_id = uuid.uuid4()
    transfer = TransferOwnershipRequest(new_owner_id=target_id)
    assert transfer.new_owner_id == target_id

    role_upd = UpdateMemberRoleRequest(role="OWNER")
    assert role_upd.role == "OWNER"

