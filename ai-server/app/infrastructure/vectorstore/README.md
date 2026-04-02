# app/infrastructure/vectorstore

## Responsibility

Provides a ChromaDB vector store wrapper for embedding-based semantic caching of dress search queries. Stores serialized `DressSearchParams` JSON alongside product metadata, enabling cache hits when similar search queries are repeated.

## Files

| File | Description |
|---|---|
| `__init__.py` | Package marker. |
| `chroma.py` | `VectorStore` class — ChromaDB HTTP client wrapper with `add_document()`, `search()` (nearest-neighbor by embedding), and `delete_document()` methods. |

## Subdirectories

None.
