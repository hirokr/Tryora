from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    app_env: str = "development"
    app_host: str = "0.0.0.0"
    app_port: int = 8000

    redis_url: str = "redis://redis:6379/0"

    r2_account_id: str = ""
    r2_access_key_id: str = ""
    r2_secret_access_key: str = ""
    r2_bucket_name: str = ""
    r2_public_base_url: str = "https://example.r2.dev"

    serper_api_key: str = ""
    llm_api_key: str = ""

    prisma_database_url: str = ""


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
