import time
from typing import Dict, Tuple
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from backend.config.settings import settings
from backend.utils.logging import logger

# Simple sliding window in-memory fallback store
_memory_store: Dict[str, list[float]] = {}


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, requests_per_minute: int = 300):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute

    async def dispatch(self, request: Request, call_next):
        # Exclude docs and health checks from rate limiting
        if request.url.path in ["/docs", "/redoc", "/openapi.json", "/health", "/ready", "/live", "/api/v1/health"]:
            return await call_next(request)

        # Identify client (API Key > Bearer token > Client IP)
        client_id = request.headers.get("X-API-Key") or request.headers.get("Authorization") or request.client.host
        window = 60.0  # 1 minute window
        now = time.time()

        if client_id in _memory_store:
            timestamps = [t for t in _memory_store[client_id] if now - t < window]
            _memory_store[client_id] = timestamps
            if len(timestamps) >= self.requests_per_minute:
                logger.warning("Rate limit exceeded", client=client_id, path=request.url.path)
                return JSONResponse(
                    status_code=429,
                    content={"success": False, "error": {"code": "RATE_LIMIT_EXCEEDED", "message": "Too many requests. Please try again later."}}
                )
            _memory_store[client_id].append(now)
        else:
            _memory_store[client_id] = [now]

        return await call_next(request)
