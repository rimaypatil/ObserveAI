from typing import Any, Dict, Optional
from fastapi import status


class ObserveAIException(Exception):
    """Base exception class for all ObserveAI platform errors."""
    def __init__(
        self,
        message: str,
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        error_code: str = "INTERNAL_SERVER_ERROR",
        details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.error_code = error_code
        self.details = details or {}


class NotFoundError(ObserveAIException):
    def __init__(self, resource_name: str, resource_id: Any):
        super().__init__(
            message=f"{resource_name} with identifier '{resource_id}' was not found.",
            status_code=status.HTTP_404_NOT_FOUND,
            error_code="RESOURCE_NOT_FOUND",
            details={"resource": resource_name, "identifier": str(resource_id)}
        )


class AuthenticationError(ObserveAIException):
    def __init__(self, message: str = "Authentication failed or token invalid."):
        super().__init__(
            message=message,
            status_code=status.HTTP_401_UNAUTHORIZED,
            error_code="AUTHENTICATION_FAILED"
        )


class AuthorizationError(ObserveAIException):
    def __init__(self, message: str = "Permission denied for requested resource."):
        super().__init__(
            message=message,
            status_code=status.HTTP_403_FORBIDDEN,
            error_code="PERMISSION_DENIED"
        )


class RateLimitError(ObserveAIException):
    def __init__(self, retry_after_seconds: int = 60):
        super().__init__(
            message=f"Rate limit exceeded. Please retry after {retry_after_seconds} seconds.",
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            error_code="RATE_LIMIT_EXCEEDED",
            details={"retry_after": retry_after_seconds}
        )


class ValidationException(ObserveAIException):
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            error_code="VALIDATION_ERROR",
            details=details
        )


class IngestionError(ObserveAIException):
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=f"Ingestion payload error: {message}",
            status_code=status.HTTP_400_BAD_REQUEST,
            error_code="INGESTION_ERROR",
            details=details
        )


class ExternalServiceError(ObserveAIException):
    def __init__(self, service_name: str, message: str):
        super().__init__(
            message=f"Integration error with {service_name}: {message}",
            status_code=status.HTTP_502_BAD_GATEWAY,
            error_code="EXTERNAL_SERVICE_ERROR",
            details={"service": service_name}
        )


class RAGException(ObserveAIException):
    def __init__(self, message: str):
        super().__init__(
            message=f"RAG Retrieval Error: {message}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            error_code="RAG_ERROR"
        )
