from typing import Optional

from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "TRYORA AI Server"
    DEBUG: bool = False

    # Master API key for internal use, not exposed to clients
    MASTER_APIKEY: str = Field(
        default="",
        validation_alias=AliasChoices("MASTER_APIKEY", "API_KEY"),
    )

    # Serper.dev configuration
    SERPER_APIKEY: str = Field(
        default="",
        validation_alias=AliasChoices("SERPER_APIKEY", "SERPER_API_KEY"),
    )
    SERPER_BASE_URL: str = Field(
        default="https://google.serper.dev",
        validation_alias="SERPER_BASE_URL",
    )

    # OpenRouter configuration
    OPEN_ROUTER_APIKEY: str = Field(default="", validation_alias="OPEN_ROUTER_APIKEY")

    # XAI configuration
    XAI_API_KEY: Optional[str] = Field(default=None, validation_alias="XAI_API_KEY")

    # Chromadb configuration
    CHROMADB_HOST: str = Field(default="localhost", validation_alias="CHROMADB_HOST")
    CHROMADB_PORT: int = Field(default=8000, validation_alias="CHROMADB_PORT")

    # Apify configuration
    APIFY_APIKEY: str = Field(default="", validation_alias="APIFY_APIKEY")
    APIFY_USER_ID: str = Field(default="", validation_alias="APIFY_USER_ID")

    # Database configuration
    DATABASE_URL: str = Field(
        default="postgresql://postgres:postgres@localhost:5432/tryora",
        validation_alias="DATABASE_URL",
    )

    # Firecrawler configuration
    FIRECRAWLER_API_KEY: Optional[str] = Field(
        default=None, validation_alias="FIRECRAWLER_API_KEY"
    )

    # ScraperAPI configuration (fallback HTML scraper with JS rendering)
    SCRAPER_API_KEY: str = Field(
        default="",
        validation_alias=AliasChoices("SCRAPER_API_KEY", "SCRAPERAPI_KEY"),
    )

    # Redis configuration (Celery broker + result backend + WebSocket pub/sub)
    REDIS_URL: str = Field(
        default="redis://localhost:6379/0", validation_alias="REDIS_URL"
    )

    # Groq configuration
    GROQ_API_KEY: Optional[str] = Field(
        default=None, validation_alias="GROQ_API_KEY"
    )

    # ---- 3D Customization ---------------------------------------------------

    # Tripo AI
    TRIPO_API_KEY: Optional[str] = Field(
        default=None,
        validation_alias=AliasChoices("TRIPO_API_KEY", "TRIPO_APIKEY"),
    )

    # JWT secret (shared with Express backend)
    JWT_SECRET: str = Field(default="changeme", validation_alias="JWT_SECRET")
    JWT_ALGORITHM: str = Field(default="HS256", validation_alias="JWT_ALGORITHM")

    # AWS S3
    AWS_ACCESS_KEY_ID: Optional[str] = Field(
        default=None, validation_alias="AWS_ACCESS_KEY_ID"
    )
    AWS_SECRET_ACCESS_KEY: Optional[str] = Field(
        default=None, validation_alias="AWS_SECRET_ACCESS_KEY"
    )
    AWS_REGION: str = Field(default="us-east-1", validation_alias="AWS_REGION")
    S3_BUCKET: str = Field(default="tryora-assets", validation_alias="S3_BUCKET")

    # Offline / local mode
    OFFLINE_MODE: bool = Field(default=False, validation_alias="OFFLINE_MODE")
    LOCAL_GLB_DIR: str = Field(default="/data/glb", validation_alias="LOCAL_GLB_DIR")

    # Rate limits
    MAX_TRIPO_CALLS_PER_USER: int = Field(
        default=10, validation_alias="MAX_TRIPO_CALLS_PER_USER"
    )
    MAX_TRIPO_CALLS_GLOBAL: int = Field(
        default=500, validation_alias="MAX_TRIPO_CALLS_GLOBAL"
    )
    TRIPO_RATE_WINDOW_SECONDS: int = Field(
        default=3600, validation_alias="TRIPO_RATE_WINDOW_SECONDS"
    )

    # Log level
    LOG_LEVEL: str = Field(default="INFO", validation_alias="LOG_LEVEL")
    ENABLE_LEGACY_ROUTES: bool = Field(
        default=True, validation_alias="ENABLE_LEGACY_ROUTES"
    )
    ENABLE_LEGACY_IMPORT_SHIMS: bool = Field(
        default=True,
        validation_alias="ENABLE_LEGACY_IMPORT_SHIMS",
    )
    ENABLE_TRY_ON_V2_SERVICE: bool = Field(
        default=True,
        validation_alias="ENABLE_TRY_ON_V2_SERVICE",
    )
    STRICT_CONFIG_VALIDATION: bool = Field(
        default=False,
        validation_alias="STRICT_CONFIG_VALIDATION",
    )

    # Tell Pydantic to read from a .env file
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()  # type: ignore

if __name__ == "__main__":
    print(settings.MASTER_APIKEY)
