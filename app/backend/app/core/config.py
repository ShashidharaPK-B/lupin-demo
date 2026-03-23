import json

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Azure OpenAI
    azure_openai_endpoint: str = ""
    azure_openai_api_key: str = ""
    azure_openai_deployment_name: str = "gpt-5-chat"
    azure_openai_api_version: str = "2024-06-01"

    # Database
    database_url: str
    postgres_pool_size: int = 10
    postgres_max_overflow: int = 20

    # Redis
    redis_url: str = "redis://redis:6379/0"
    redis_ttl: int = 3600

    # Backend
    backend_port: int = 8000
    secret_key: str
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:5173"]
    upload_dir: str = "/app/uploads"

    # Vite / Frontend (ignored by backend but present for reference)
    vite_api_url: str = "http://localhost:8000"
    vite_app_name: str = "AI Should Cost Engine"

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: str | list[str]) -> list[str]:
        if isinstance(v, str):
            try:
                parsed = json.loads(v)
                if isinstance(parsed, list):
                    return parsed
            except (json.JSONDecodeError, ValueError):
                pass
            return [o.strip() for o in v.split(",") if o.strip()]
        return v


settings = Settings()
