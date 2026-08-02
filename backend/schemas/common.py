import uuid
from datetime import datetime
from typing import Any, Generic, List, Optional, TypeVar
from pydantic import BaseModel, ConfigDict, Field

T = TypeVar("T")


class APIResponse(BaseModel, Generic[T]):
    """Standardized API envelope response for all endpoints."""
    success: bool = True
    message: str = "Operation executed successfully."
    data: Optional[T] = None
    meta: Optional[dict[str, Any]] = None


class PaginatedResponse(BaseModel, Generic[T]):
    """Standardized paginated list response."""
    items: List[T]
    total: int
    page: int
    size: int
    pages: int


class ErrorDetail(BaseModel):
    error_code: str
    message: str
    details: Optional[dict[str, Any]] = None


class StandardErrorResponse(BaseModel):
    success: bool = False
    error: ErrorDetail
