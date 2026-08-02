import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional
import jwt
from passlib.context import CryptContext

from backend.config.settings import settings
from backend.utils.exceptions import AuthenticationError

import bcrypt

def hash_password(password: str) -> str:
    """Hashes a raw password string using bcrypt."""
    pwd_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain password against the stored bcrypt hash."""
    pwd_bytes = plain_password.encode("utf-8")[:72]
    hashed_bytes = hashed_password.encode("utf-8")
    try:
        return bcrypt.checkpw(pwd_bytes, hashed_bytes)
    except Exception:
        return False


def create_access_token(subject: str, extra_claims: Optional[Dict[str, Any]] = None) -> str:
    """Generates a signed JWT access token."""
    now = datetime.now(timezone.utc)
    expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    payload = {
        "sub": subject,
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
        "type": "access"
    }
    if extra_claims:
        payload.update(extra_claims)

    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_refresh_token(subject: str) -> str:
    """Generates a signed JWT refresh token."""
    now = datetime.now(timezone.utc)
    expire = now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    payload = {
        "sub": subject,
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
        "type": "refresh"
    }

    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> Dict[str, Any]:
    """Decodes and validates a JWT token."""
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise AuthenticationError("JWT token has expired.")
    except jwt.InvalidTokenError:
        raise AuthenticationError("Invalid JWT token format.")


def generate_api_key(environment: str = "live") -> tuple[str, str]:
    """
    Generates a new SDK / Integration API key and its SHA-256 hash.
    Returns (raw_key, hashed_key).
    Raw key format: obs_live_<32_random_bytes_hex>
    """
    random_bytes = secrets.token_hex(24)
    raw_key = f"obs_{environment}_{random_bytes}"
    hashed_key = hash_api_key(raw_key)
    return raw_key, hashed_key


def hash_api_key(raw_key: str) -> str:
    """Computes SHA-256 digest of an API key for safe database storage."""
    return hmac.new(
        settings.SECRET_KEY.encode("utf-8"),
        raw_key.encode("utf-8"),
        hashlib.sha256
    ).hexdigest()


def mask_sensitive_data(data: str) -> str:
    """Masks secret tokens or keys for safe logging."""
    if not data or len(data) < 8:
        return "********"
    return f"{data[:4]}...{data[-4:]}"


def generate_reset_token() -> tuple[str, str]:
    """Generates a secure password reset token and its SHA-256 hash. Returns (raw_token, hashed_token)."""
    raw_token = secrets.token_urlsafe(32)
    hashed_token = hash_api_key(raw_token)
    return raw_token, hashed_token

