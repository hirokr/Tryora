from ..core.config import settings as config_settings
from .vectordb import VectorStore

vector_db = VectorStore(
    host=config_settings.CHROMADB_HOST, 
    port=config_settings.CHROMADB_PORT
)
