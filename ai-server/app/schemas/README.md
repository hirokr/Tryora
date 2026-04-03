# app/schemas

## Responsibility

Shared Pydantic schema definitions that serve as request/response contracts across feature modules. Currently houses the dress search domain models, which are imported by both the `dress_search` module and the API router layer.

## Files

| File | Description |
|---|---|
| `__init__.py` | Package marker. |
| `dress_search.py` | Pydantic models for the dress search feature: `BudgetRange`, `DressSearchParams` (LLM-structured output), `SearchDressesRequest`, `SearchDressesResponse`, `SearchStatusResponse`, and `DressProductSchema`. See `app/modules/dress_search/schemas.py` for the canonical copy. |

## Subdirectories (if any)

None.
