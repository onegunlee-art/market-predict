from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    debug: bool = True
    host: str = "0.0.0.0"
    port: int = 8000

    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/market_predict"
    redis_url: str = "redis://localhost:6379"

    api_key: str = "development-api-key"
    jwt_secret: str = "development-secret-change-in-production"

    cors_origins: List[str] = ["http://localhost:3000", "http://localhost:4000"]

    tmdb_api_key: str = ""
    youtube_api_key: str = ""

    model_version: str = "v1.0.0"
    default_confidence: float = 0.7

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
