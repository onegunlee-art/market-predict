from fastapi import APIRouter
from src.services.redis_client import redis_client

router = APIRouter()


@router.get("/")
async def health_check():
    return {
        "status": "healthy",
        "service": "ai-engine",
    }


@router.get("/ready")
async def readiness_check():
    redis_ok = await redis_client.ping()

    return {
        "status": "ready" if redis_ok else "not ready",
        "services": {
            "redis": "connected" if redis_ok else "disconnected",
        },
    }
