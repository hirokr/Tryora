# app/db/

Database connection and Prisma client lifecycle management.

## Responsibility

Manages the Prisma client instance and provides the FastAPI lifespan for database connection/disconnection. Also holds the legacy ChromaDB vector store connection helper.

## Files

| File | Description |
|---|---|
| `prisma_connect.py` | Prisma client singleton + FastAPI lifespan. Initializes Redis cache on `app.state` during startup. |
| `session.py` | Database session helpers (if any). |
| `base.py` | Base model definitions and placeholder query helpers. |
| `vectordb.py` | ChromaDB vector store connection wrapper. |
| `__init__.py` | Package marker — re-exports `db` and `lifespan` from `prisma_connect`. |

## Subdirectories

| Directory | Description |
|---|---|
| `repositories/` *(in `infrastructure/db/`)* | Typed repository pattern for Prisma queries. |

## Usage

```python
from app.db.prisma_connect import db, lifespan

# In FastAPI app
app = FastAPI(lifespan=lifespan)

# In route handlers (via dependency injection)
from app.api.deps import get_db
```
