# BASE
import json

from fastapi import FastAPI, Depends
from pathlib import Path
BASE_DIR = Path(__file__).resolve().parent

# CONFIG
from .middleware.secure_keys import checkApiKey
from .api.v1.health import router as health_router
from .middleware.audit_log import AuditLogMiddleware

# LLM APIs
from .LLM.openapi import open_api

# vector DB
from .db.base import vector_db


# Init FastAPI app
app = FastAPI(title="Tryora AI server", description="A server for managing AI operations for the Tryora platform", version="1.0.0")

app.add_middleware(AuditLogMiddleware)

app.include_router(health_router, prefix="/api/v1")

@app.get("/data")
async def get_data(server_name: str = Depends(checkApiKey)):
    return {"message": f"Hello {server_name}, here is your data."}

@app.get("/")
async def get():
    return {"message": "Hello, here is your data."}


import json
from fastapi import HTTPException
from pathlib import Path

# Assuming BASE_DIR and vector_db are initialized globally
BASE_DIR = Path(__file__).resolve().parent


# TODO: remove this endpoint after testing, it's just for demo purposes. In production, you would have a more secure and robust way to handle embeddings and vector DB interactions.
@app.get("/embeddings")
async def get_embeddings():
    file_path = BASE_DIR / "firstEmbedding.json"
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="firstEmbedding.json not found")

    # Use a context manager to read the file
    with open(file_path, "r") as f:
        try:
            data = json.load(f)
        except json.JSONDecodeError:
            raise HTTPException(status_code=500, detail="Invalid JSON format in file")

    # Extract the embedding list
    embedding_vector = data.get("embedding")
    
    if not embedding_vector or not isinstance(embedding_vector, list):
        raise HTTPException(status_code=400, detail="File missing 'embedding' list")

    # 1. Add to Vector DB
    vector_db.add_document(
        doc_id="doc1",
        embedding=embedding_vector,
        document="This is a sample document for testing.",
        metadata={"source": "test"}
    )
    
    # Return the results from the DB, not just the input
    return {"status": "success", "results": embedding_vector}


@app.get("/embeddings/search")
async def search_embeddings():
    """
    NOTE: Real search requires a numerical vector. 
    You cannot pass ['my_embeddings'] (strings) to a Vector DB.
    """
    # For a real search, you'd usually get this from an LLM or a request body
    # Here we use a dummy vector of 1536 dimensions (Standard OpenAI size) 
    # or whatever size your DB expects.
    mock_query_vector = [0.1] * 1536 

    results = vector_db.search(query_embedding=mock_query_vector, n_results=3)
    
    return {"search_results": results}
