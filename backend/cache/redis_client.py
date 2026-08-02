import json
from typing import Any, Optional
import redis.asyncio as redis
from backend.config.settings import settings
from backend.utils.logging import logger


class RedisCacheManager:
    """Async Redis Client for session caching, rate limiting, and agent state storage."""

    def __init__(self):
        self._pool: Optional[redis.ConnectionPool] = None

    async def get_client(self) -> redis.Redis:
        if self._pool is None:
            self._pool = redis.ConnectionPool.from_url(
                settings.redis_url,
                max_connections=settings.REDIS_POOL_SIZE,
                decode_responses=True
            )
        return redis.Redis(connection_pool=self._pool)

    async def get(self, key: str) -> Optional[Any]:
        try:
            client = await self.get_client()
            value = await client.get(key)
            if value:
                return json.loads(value)
            return None
        except Exception as exc:
            logger.error("Redis get failed", key=key, error=str(exc))
            return None

    async def set(self, key: str, value: Any, ttl_seconds: int = settings.DEFAULT_CACHE_TTL) -> bool:
        try:
            client = await self.get_client()
            serialized = json.dumps(value)
            await client.set(key, serialized, ex=ttl_seconds)
            return True
        except Exception as exc:
            logger.error("Redis set failed", key=key, error=str(exc))
            return False

    async def delete(self, key: str) -> bool:
        try:
            client = await self.get_client()
            await client.delete(key)
            return True
        except Exception as exc:
            logger.error("Redis delete failed", key=key, error=str(exc))
            return False

    async def is_rate_limited(self, identifier: str, max_requests: int, window_seconds: int) -> bool:
        """Sliding window rate limit checker via Redis INCR and EXPIRE."""
        try:
            client = await self.get_client()
            key = f"ratelimit:{identifier}"
            current = await client.incr(key)
            if current == 1:
                await client.expire(key, window_seconds)
            return current > max_requests
        except Exception as exc:
            logger.error("Redis rate limit check failed", identifier=identifier, error=str(exc))
            return False


redis_cache = RedisCacheManager()
