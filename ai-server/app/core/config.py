from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
from typing import Optional

class Settings(BaseSettings):

    PROJECT_NAME: str = "TRYORA AI Server"
    DEBUG: bool = False

    # Master API key for internal use, not exposed to clients
    MASTER_APIKEY: str = Field(..., validation_alias="MASTER_APIKEY")

    # Serper.dev configuration
    SERPER_APIKEY: str = Field(..., validation_alias="SERPER_API_KEY")
    SERPER_BASE_URL: str = Field(..., validation_alias="SERPER_BASE_URL")

    # OpenRouter configuration
    OPEN_ROUTER_APIKEY: str = Field(..., validation_alias="OPEN_ROUTER_APIKEY")

    # XAI configuration
    XAI_API_KEY: Optional[str] = Field(default=None, validation_alias="XAI_API_KEY")

    # Chromadb configuration
    CHROMADB_HOST: str = Field(..., validation_alias="CHROMADB_HOST")
    CHROMADB_PORT: int = Field(..., validation_alias="CHROMADB_PORT")

    # Apify configuration
    APIFY_APIKEY: str = Field(..., validation_alias="APIFY_APIKEY")

    # Database configuration
    DATABASE_URL: str = Field(..., validation_alias="DATABASE_URL")

    # Firecrawler configuration
    FIRECRAWLER_API_KEY: Optional[str] = Field(default=None, validation_alias="FIRECRAWLER_API_KEY")

    # ScraperAPI configuration (fallback HTML scraper with JS rendering)
    SCRAPER_API_KEY: str = Field(..., validation_alias="SCRAPERAPI_KEY")

    # Redis configuration (Celery broker + result backend + WebSocket pub/sub)
    REDIS_URL: str = Field(default="redis://localhost:6379/0", validation_alias="REDIS_URL")

    # Tell Pydantic to read from a .env file
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

settings = Settings() #type: ignore

if __name__ == "__main__":
    print(settings.MASTER_APIKEY)