from fastapi import Request, status
from fastapi.responses import JSONResponse
from backend.schemas.common import StandardErrorResponse
from backend.utils.exceptions import ObserveAIException
from backend.utils.logging import logger


async def observeai_exception_handler(request: Request, exc: ObserveAIException) -> JSONResponse:
    """Global exception handler converting ObserveAIException to standard JSON error format."""
    logger.warning(
        "ObserveAI platform exception",
        path=request.url.path,
        error_code=exc.error_code,
        message=exc.message
    )
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "error_code": exc.error_code,
                "message": exc.message,
                "details": exc.details
            }
        }
    )


async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Unhandled fallback exception handler masking raw internal error details."""
    logger.error("Unhandled internal server exception", path=request.url.path, error=str(exc))
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": {
                "error_code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected server error occurred. Please contact system support.",
                "details": {}
            }
        }
    )
