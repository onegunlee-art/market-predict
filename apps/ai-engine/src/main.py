from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from src.config import settings
from src.routers import prior, sentiment, health
from src.services.redis_client import redis_client


@asynccontextmanager
async def lifespan(app: FastAPI):
    await redis_client.connect()
    yield
    await redis_client.disconnect()


app = FastAPI(
    title="Market Predict AI Engine",
    description="AI Engine for Cultural Prediction Market Platform",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/health", tags=["Health"])
app.include_router(prior.router, prefix="/api/v1/prior", tags=["Prior Probability"])
app.include_router(sentiment.router, prefix="/api/v1/sentiment", tags=["Sentiment Analysis"])


@app.get("/")
async def root():
    return {
        "service": "Market Predict AI Engine",
        "version": "0.1.0",
        "status": "running",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "src.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
    )
