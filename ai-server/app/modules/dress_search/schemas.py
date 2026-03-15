"""
Pydantic models that describe the dress-search feature domain.

Three layers:

1. **DressSearchParams** — the strict structured output the LLM must produce
   when parsing the user's free-text prompt.  Every field is Optional so the
   LLM can leave unknown attributes null rather than hallucinating them.

2. **Request / Response** — HTTP payload shapes for the FastAPI endpoints.

3. **DressProductSchema** — the canonical shape of a single product result
   that is persisted to Postgres and broadcast to the frontend.
"""

from __future__ import annotations

from typing import Optional
from pydantic import BaseModel, Field, HttpUrl


# ---------------------------------------------------------------------------
# LLM Structured Output
# ---------------------------------------------------------------------------

class BudgetRange(BaseModel):
    """Optional price window extracted from the user's prompt."""
    min: Optional[float] = Field(default=None, description="Minimum acceptable price")
    max: Optional[float] = Field(default=None, description="Maximum acceptable price")
    currency: str = Field(default="USD", description="ISO 4217 currency code")


class DressSearchParams(BaseModel):
    """
    Strict parsed representation of a user's dress-search prompt.

    The LLM must populate as many fields as can be confidently inferred
    from the prompt.  Fields that cannot be inferred should be null — the
    LLM must NOT guess or hallucinate values.

    This model is serialised to JSON and used for:
    - ChromaDB cache key (embedding of the JSON string)
    - Smart query-string construction for Serper Shopping
    """

    event: Optional[str] = Field(
        default=None,
        description="The occasion or event type (e.g. 'beach wedding', 'black-tie gala').",
    )
    style_keywords: Optional[list[str]] = Field(
        default=None,
        description="List of style adjectives (e.g. ['boho', 'minimalist', 'flowy']).",
    )
    colors: Optional[list[str]] = Field(
        default=None,
        description="List of desired colors (e.g. ['dusty rose', 'ivory']).",
    )
    geo: Optional[str] = Field(
        default=None,
        description="Geographic location to source or filter results (e.g. 'Miami, FL').",
    )
    garment_length: Optional[str] = Field(
        default=None,
        description="Hem length (e.g. 'maxi', 'midi', 'mini', 'knee-length').",
    )
    fabric: Optional[str] = Field(
        default=None,
        description="Primary fabric (e.g. 'chiffon', 'linen', 'satin').",
    )
    neckline: Optional[str] = Field(
        default=None,
        description="Neckline style (e.g. 'V-neck', 'off-shoulder', 'halter').",
    )
    season: Optional[str] = Field(
        default=None,
        description="Target season (e.g. 'summer', 'winter', 'all-season').",
    )
    budget_range: Optional[BudgetRange] = Field(
        default=None,
        description="Optional price window inferred from the prompt.",
    )


# ---------------------------------------------------------------------------
# HTTP Request / Response Shapes
# ---------------------------------------------------------------------------

class SearchDressesRequest(BaseModel):
    """Body payload for POST /search-dresses."""

    prompt: str = Field(
        ...,
        min_length=3,
        max_length=500,
        description="Free-text dress preference from the user (e.g. 'I need a flowy maxi for a beach wedding').",
        examples=["I need a flowy maxi dress for a beach wedding this summer"],
    )
    geo: str = Field(
        ...,
        min_length=2,
        max_length=200,
        description="User's geographical context (e.g. 'Miami, FL' or 'London, UK').",
        examples=["Miami, FL"],
    )


class SearchDressesResponse(BaseModel):
    """Immediate HTTP 202 response — the worker runs asynchronously."""

    task_id: str = Field(..., description="Celery task ID for polling / WebSocket subscription.")
    search_id: str = Field(..., description="Postgres DressSearch UUID.")
    status: str = Field(default="PENDING")
    message: str = Field(default="Your search has been queued. Connect to the WebSocket to receive results.")


class SearchStatusResponse(BaseModel):
    """
    Payload shape broadcast over the WebSocket / SSE channel when the
    pipeline finishes (or fails).
    """

    task_id: str
    search_id: str
    status: str  # "COMPLETED" | "FAILED" | "PROCESSING"
    products: Optional[list["DressProductSchema"]] = None
    error: Optional[str] = None


# ---------------------------------------------------------------------------
# Product Result Shape
# ---------------------------------------------------------------------------

class DressProductSchema(BaseModel):
    """
    Canonical representation of a single dress result.

    Used for:
    - Persisting to Postgres (DressProduct model)
    - Broadcasting via WebSocket to the frontend
    - Upserting metadata into ChromaDB alongside the embedding
    """

    product_name: str = Field(..., description="Display name of the product.")
    price: Optional[str] = Field(default=None, description="Price as a formatted string (e.g. '$149.99').")
    image_url: Optional[str] = Field(default=None, description="Direct URL to the product image.")
    product_url: str = Field(..., description="Canonical URL of the product page.")
    description: Optional[str] = Field(default=None, description="Full product description text.")
    brand: Optional[str] = Field(default=None, description="Brand or retailer name.")
    availability: Optional[str] = Field(default=None, description="Stock status (e.g. 'In Stock').")
    raw_metadata: Optional[dict] = Field(
        default=None,
        description="Full raw payload (JSON-LD or Serper item) for audit and reprocessing.",
    )
    source: Optional[str] = Field(
        default=None,
        description="Data source tag: 'serper', 'scraper', or 'cache'.",
    )
