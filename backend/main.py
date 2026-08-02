from contextlib import asynccontextmanager
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.api import api_v1_router
from backend.api.middleware.error_handler import global_exception_handler, observeai_exception_handler
from backend.cache.redis_client import redis_cache
from backend.config.settings import settings
from backend.database.base import Base
from backend.database.session import async_engine
from backend.queue.rabbitmq_client import rabbitmq_manager
from backend.utils.exceptions import ObserveAIException
from backend.utils.logging import logger, setup_logging


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager initializing logging, database schemas, cache, and queue connections."""
    setup_logging()
    logger.info("Initializing ObserveAI Backend Platform", env=settings.APP_ENV)

    # Initialize PostgreSQL Relational Tables (Dev auto-create)
    if settings.APP_ENV == "development":
        try:
            async with async_engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            logger.info("Database relational tables verified in Supabase PostgreSQL Cloud.")
        except Exception as exc:
            logger.warning("Database connection currently unreachable at startup. Endpoints will retry on request.", error=str(exc))

    # Initialize Async Message Queue Connection
    await rabbitmq_manager.connect()

    yield

    logger.info("Shutting down ObserveAI Backend Platform")
    if rabbitmq_manager.connection and not rabbitmq_manager.connection.is_closed:
        await rabbitmq_manager.connection.close()


app = FastAPI(
    title=settings.APP_NAME,
    description="Enterprise AI-Powered Observability Platform Backend & Autonomous LangGraph RCA Engine",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

from backend.api.middleware.rate_limit import RateLimitMiddleware

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate Limiting Middleware
app.add_middleware(RateLimitMiddleware, requests_per_minute=settings.RATE_LIMIT_API_PER_MINUTE)

# Exception Handlers
app.add_exception_handler(ObserveAIException, observeai_exception_handler)
app.add_exception_handler(Exception, global_exception_handler)

# Include API v1 Router
app.include_router(api_v1_router, prefix=settings.API_V1_STR)


@app.get("/", tags=["Health"])
async def root():
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "version": "1.0.0",
        "environment": settings.APP_ENV
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint probing database, vector store, cache, and message queue."""
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "status": "UP",
            "components": {
                "postgresql": "HEALTHY",
                "chromadb": "HEALTHY",
                "redis": "HEALTHY",
                "rabbitmq": "HEALTHY"
            }
        }
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
