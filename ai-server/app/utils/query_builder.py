"""
query_builder.py
----------------
Constructs a highly-specific Google Shopping search string from the
structured DressSearchParams produced by the LLM parsing step.

Design goals
~~~~~~~~~~~~
* Only include fields that are non-null / non-empty — no filler tokens.
* Produce a natural, human-readable query that works well with the
  Google Shopping index (short noun-phrase style, no boolean operators).
* Expose the logic as a single pure function so it is easy to unit-test
  in isolation.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.schemas.dress_search import DressSearchParams


def build_shopping_query(params: "DressSearchParams") -> str:
    """
    Combine the non-null fields of *params* into a Google Shopping
    search string.

    The template is:
        [colors] [fabric] [neckline] [style_keywords] [garment_length]
        dress for [event] — [season] — buy online [geo]

    Any segment whose source field is None/empty is simply omitted so the
    query never contains placeholder tokens like "None dress".

    Parameters
    ----------
    params:
        Fully-parsed DressSearchParams from the LLM step.

    Returns
    -------
    str
        A concise, descriptive search string ready to be sent to Serper.
    """
    parts: list[str] = []

    # ---- colour adjectives ----
    if params.colors:
        parts.append(" ".join(params.colors))

    # ---- fabric ----
    if params.fabric:
        parts.append(params.fabric)

    # ---- neckline ----
    if params.neckline:
        parts.append(params.neckline)

    # ---- style keywords ----
    if params.style_keywords:
        parts.append(" ".join(params.style_keywords))

    # ---- garment length + core noun ----
    if params.garment_length:
        parts.append(f"{params.garment_length} dress")
    else:
        parts.append("dress")

    # ---- event context ----
    if params.event:
        parts.append(f"for {params.event}")

    # ---- season ----
    if params.season:
        parts.append(params.season)

    # ---- budget hint — adds "under $X" or "$X-$Y" ----
    if params.budget_range:
        br = params.budget_range
        currency = br.currency or "USD"
        symbol = "$" if currency == "USD" else currency + " "
        if br.max and not br.min:
            parts.append(f"under {symbol}{int(br.max)}")
        elif br.min and br.max:
            parts.append(f"{symbol}{int(br.min)}-{symbol}{int(br.max)}")

    # ---- geographic context — last so it narrows shipping/availability ----
    if params.geo:
        parts.append(f"buy online {params.geo}")

    query = " ".join(parts)
    return query
