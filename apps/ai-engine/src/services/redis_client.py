import redis.asyncio as redis
from src.config import settings


class RedisClient:
    def __init__(self):
        self.client: redis.Redis | None = None

    async def connect(self):
        self.client = redis.from_url(
            settings.redis_url,
            encoding="utf-8",
            decode_responses=True,
        )

    async def disconnect(self):
        if self.client:
            await self.client.close()

    async def ping(self) -> bool:
        if not self.client:
            return False
        try:
            await self.client.ping()
            return True
        except Exception:
            return False

    async def get(self, key: str) -> str | None:
        if not self.client:
            return None
        return await self.client.get(key)

    async def set(self, key: str, value: str, ex: int | None = None):
        if not self.client:
            return
        await self.client.set(key, value, ex=ex)

    async def publish(self, channel: str, message: str):
        if not self.client:
            return
        await self.client.publish(channel, message)


redis_client = RedisClient()
