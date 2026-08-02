import pytest
from backend.utils.security import create_access_token, decode_token, hash_password, verify_password


def test_password_hashing():
    raw_pass = "SecureP@ssword2026!"
    hashed = hash_password(raw_pass)

    assert hashed != raw_pass
    assert verify_password(raw_pass, hashed) is True
    assert verify_password("WrongPassword", hashed) is False


def test_jwt_token_claims():
    subject = "user_uuid_123"
    token = create_access_token(subject, extra_claims={"role": "admin"})

    payload = decode_token(token)
    assert payload["sub"] == subject
    assert payload["role"] == "admin"
    assert payload["type"] == "access"
