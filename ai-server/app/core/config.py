from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
from typing import Optional

class Settings(BaseSettings):

    MASTER_APIKEY: str = Field(..., validation_alias="MASTER_APIKEY")
    SERPER_APIKEY: str = Field(..., validation_alias="SERPER_APIKEY")
    OPEN_ROUTER_APIKEY: str = Field(..., validation_alias="OPEN_ROUTER_APIKEY")

    # Chromadb configuration
    CHROMADB_HOST: str = Field(..., validation_alias="CHROMADB_HOST")
    CHROMADB_PORT: int = Field(..., validation_alias="CHROMADB_PORT")
    
    PROJECT_NAME: str = "TRYORA AI Server"
    DEBUG: bool = False

    # Tell Pydantic to read from a .env file
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

settings = Settings() #type: ignore

if __name__ == "__main__":
  print(settings.MASTER_APIKEY)