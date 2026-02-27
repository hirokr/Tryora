import chromadb
from typing import List, Dict, Any, Optional

class VectorStore:
    def __init__(self, host: str, port: int, collection_name: str = "my_embeddings"):
        """Initialize the ChromaDB client and get/create the collection."""
        self.client = chromadb.HttpClient(host=host, port=port)
        # We handle the collection once at initialization
        self.collection = self.client.get_or_create_collection(name=collection_name)

    def add_document(
        self, 
        doc_id: str, 
        embedding: List[float], 
        document: str, 
        metadata: Optional[Dict[str, Any]] = None
    ):
        """Add a single document and its embedding to the store."""
        self.collection.add(
            ids=[doc_id],
            embeddings=[embedding],
            metadatas=[metadata or {}],
            documents=[document]
        )

    def search(self, query_embedding: List[float], n_results: int = 3):
        """Query the vector store for the closest matches."""
        return self.collection.query(
            query_embeddings=[query_embedding],
            n_results=n_results
        )

    def delete_document(self, doc_id: str):
        """Remove a document from the store."""
        self.collection.delete(ids=[doc_id])

