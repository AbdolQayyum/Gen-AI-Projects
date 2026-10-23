from functools import lru_cache
from typing import Annotated, Any

from pydantic import field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


class Settings(BaseSettings):
    project_name: str = "AI Knowledge Support Assistant API"
    environment: str = "local"
    api_v1_prefix: str = "/api/v1"
    database_url: str = "sqlite:///./app.db"
    upload_dir: str = "uploads"
    pgvector_url: str | None = None
    embedding_model: str = "gemini-embedding-2"
    embedding_dimensions: int = 768
    chunk_size: int = 1000
    chunk_overlap: int = 150
    secret_key: str = "change-this-secret-before-production"
    access_token_expire_minutes: int = 30
    google_api_key: str | None = None
    gemini_model: str = "gemini-3.8-flash"
    llm_provider: str = "groq"
    groq_api_key: str | None = None
    groq_model: str = "openai/gpt-oss-120b"
    langsmith_tracing: bool = False
    langsmith_api_key: str | None = None
    langsmith_project: str = "ai-knowledge-support-assistant"
    cors_origins: Annotated[list[str], NoDecode] = [
        "http://localhost:3000",
        "http://localhost:8000",
    ]
    allowed_hosts: list[str] = ["*"]
    log_level: str = "INFO"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    @field_validator("cors_origins", mode="before")
    @classmethod
    def split_cors_origins(cls, value: Any) -> list[str]:
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
