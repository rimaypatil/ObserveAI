import httpx
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from backend.config.settings import settings
from backend.utils.logging import logger


class HealthService:
    async def check_health(self, session: AsyncSession) -> dict:
        health_status = {
            "status": "healthy",
            "version": "1.0.0",
            "environment": settings.APP_ENV,
            "components": {}
        }

        # 1. Database Check
        try:
            await session.execute(text("SELECT 1"))
            health_status["components"]["database"] = {"status": "up"}
        except Exception as exc:
            health_status["components"]["database"] = {"status": "down", "error": str(exc)}
            health_status["status"] = "degraded"

        # 2. Redis Check
        try:
            import redis.asyncio as aioredis
            r = aioredis.Redis(host=settings.REDIS_HOST, port=settings.REDIS_PORT, socket_timeout=2)
            await r.ping()
            await r.aclose()
            health_status["components"]["redis"] = {"status": "up"}
        except Exception as exc:
            health_status["components"]["redis"] = {"status": "degraded", "error": str(exc)}

        # 3. RabbitMQ Check
        try:
            import aio_pika
            conn = await aio_pika.connect_robust(settings.rabbitmq_url, timeout=2)
            await conn.close()
            health_status["components"]["rabbitmq"] = {"status": "up"}
        except Exception as exc:
            health_status["components"]["rabbitmq"] = {"status": "degraded", "error": str(exc)}

        # 4. ChromaDB Check
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(f"http://{settings.CHROMADB_HOST}:{settings.CHROMADB_PORT}/api/v1/heartbeat", timeout=2)
                if resp.status_code == 200:
                    health_status["components"]["chromadb"] = {"status": "up"}
                else:
                    health_status["components"]["chromadb"] = {"status": "degraded"}
        except Exception:
            health_status["components"]["chromadb"] = {"status": "degraded"}

        # 5. Gemini API Key Check
        if settings.GEMINI_API_KEY:
            health_status["components"]["gemini_api"] = {"status": "configured"}
        else:
            health_status["components"]["gemini_api"] = {"status": "not_configured"}

        return health_status


health_service = HealthService()
