import json
import logging
from typing import Any

import redis.asyncio as aioredis

from app.core.config import settings

logger = logging.getLogger(__name__)

_redis: aioredis.Redis | None = None


async def get_redis() -> aioredis.Redis:
    """Get or create the Redis connection."""
    global _redis
    if _redis is None:
        _redis = aioredis.from_url(
            settings.redis_url,
            decode_responses=True,
            socket_connect_timeout=5,
            retry_on_timeout=True,
        )
    return _redis


async def close_redis() -> None:
    """Close the Redis connection."""
    global _redis
    if _redis is not None:
        await _redis.close()
        _redis = None


async def cache_get(key: str) -> Any | None:
    """Get a value from cache. Returns None on miss or error."""
    try:
        r = await get_redis()
        value = await r.get(key)
        if value is not None:
            return json.loads(value)
    except Exception as e:
        logger.warning(f"Redis cache get failed for key={key}: {e}")
    return None


async def cache_set(key: str, value: Any, ttl: int | None = None) -> None:
    """Set a value in cache with optional TTL override."""
    try:
        r = await get_redis()
        await r.set(key, json.dumps(value), ex=ttl or settings.redis_ttl)
    except Exception as e:
        logger.warning(f"Redis cache set failed for key={key}: {e}")


async def cache_delete(key: str) -> None:
    """Delete a key from cache."""
    try:
        r = await get_redis()
        await r.delete(key)
    except Exception as e:
        logger.warning(f"Redis cache delete failed for key={key}: {e}")


async def redis_health() -> bool:
    """Check Redis connectivity."""
    try:
        r = await get_redis()
        return await r.ping()
    except Exception:
        return False
