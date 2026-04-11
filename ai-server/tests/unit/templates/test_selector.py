"""Unit tests for template selection priority and cache behavior."""

from __future__ import annotations

from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.modules.templates.selector import select_best_template


def _template(
    *,
    template_id: str,
    category: str = "CASUAL",
    body_label: str | None = None,
    ethnicity: str | None = None,
) -> SimpleNamespace:
    return SimpleNamespace(
        id=template_id,
        name=f"Template-{template_id}",
        category=category,
        ethnicity=ethnicity,
        bodyLabel=body_label,
        glbS3Key=f"catalog/{template_id}.glb",
        thumbnailUrl=f"https://cdn.example.com/{template_id}.jpg",
    )


@pytest.mark.asyncio
async def test_returns_cached_template_without_db_queries():
    db = MagicMock()
    db.dresstemplate = MagicMock()
    db.dresstemplate.find_first = AsyncMock()

    cache = MagicMock()
    cache.key_template_select = MagicMock(return_value="tmpl:user-1:CASUAL")
    cache.get_json = AsyncMock(return_value={"id": "cached-tmpl"})
    cache.set_json = AsyncMock()

    result = await select_best_template(
        user_id="user-1",
        body_label="TALL_SLIM",
        category="CASUAL",
        ethnicity="ASIAN",
        consent_given=True,
        db=db,
        cache=cache,
    )

    assert result == {"id": "cached-tmpl"}
    db.dresstemplate.find_first.assert_not_called()
    cache.set_json.assert_not_called()


@pytest.mark.asyncio
async def test_tier1_exact_match_when_consent_and_ethnicity_available():
    tier1 = _template(template_id="t1", body_label="TALL_SLIM", ethnicity="ASIAN")

    db = MagicMock()
    db.dresstemplate = MagicMock()
    db.dresstemplate.find_first = AsyncMock(side_effect=[tier1])

    cache = MagicMock()
    cache.key_template_select = MagicMock(return_value="tmpl:user-1:CASUAL")
    cache.get_json = AsyncMock(return_value=None)
    cache.set_json = AsyncMock()

    result = await select_best_template(
        user_id="user-1",
        body_label="TALL_SLIM",
        category="CASUAL",
        ethnicity="ASIAN",
        consent_given=True,
        db=db,
        cache=cache,
    )

    assert result is not None
    assert result["id"] == "t1"
    assert db.dresstemplate.find_first.await_count == 1
    first_where = db.dresstemplate.find_first.await_args.kwargs["where"]
    assert first_where["ethnicity"] == "ASIAN"
    assert first_where["bodyLabel"] == "TALL_SLIM"
    cache.set_json.assert_called_once()


@pytest.mark.asyncio
async def test_tier2_body_label_fallback_when_tier1_missing():
    tier2 = _template(template_id="t2", body_label="AVERAGE_SLIM", ethnicity=None)

    db = MagicMock()
    db.dresstemplate = MagicMock()
    db.dresstemplate.find_first = AsyncMock(side_effect=[None, tier2])

    cache = MagicMock()
    cache.key_template_select = MagicMock(return_value="tmpl:user-2:FORMAL")
    cache.get_json = AsyncMock(return_value=None)
    cache.set_json = AsyncMock()

    result = await select_best_template(
        user_id="user-2",
        body_label="AVERAGE_SLIM",
        category="FORMAL",
        ethnicity="LATIN",
        consent_given=True,
        db=db,
        cache=cache,
    )

    assert result is not None
    assert result["id"] == "t2"
    assert db.dresstemplate.find_first.await_count == 2


@pytest.mark.asyncio
async def test_tier3_universal_fallback_when_no_body_template():
    universal = _template(template_id="t3", body_label=None, ethnicity=None)

    db = MagicMock()
    db.dresstemplate = MagicMock()
    db.dresstemplate.find_first = AsyncMock(side_effect=[None, None, universal])

    cache = MagicMock()
    cache.key_template_select = MagicMock(return_value="tmpl:user-3:SPORT")
    cache.get_json = AsyncMock(return_value=None)
    cache.set_json = AsyncMock()

    result = await select_best_template(
        user_id="user-3",
        body_label="SHORT_PLUS",
        category="SPORT",
        ethnicity="BLACK",
        consent_given=True,
        db=db,
        cache=cache,
    )

    assert result is not None
    assert result["id"] == "t3"
    assert db.dresstemplate.find_first.await_count == 3


@pytest.mark.asyncio
async def test_returns_none_when_no_template_matches():
    db = MagicMock()
    db.dresstemplate = MagicMock()
    db.dresstemplate.find_first = AsyncMock(side_effect=[None, None, None])

    cache = MagicMock()
    cache.key_template_select = MagicMock(return_value="tmpl:user-4:CASUAL")
    cache.get_json = AsyncMock(return_value=None)
    cache.set_json = AsyncMock()

    result = await select_best_template(
        user_id="user-4",
        body_label="TALL_PLUS",
        category="CASUAL",
        ethnicity="ASIAN",
        consent_given=True,
        db=db,
        cache=cache,
    )

    assert result is None
    cache.set_json.assert_not_called()


@pytest.mark.asyncio
async def test_skips_tier1_when_consent_missing_even_with_ethnicity():
    tier2 = _template(template_id="t4", body_label="TALL_AVERAGE", ethnicity=None)

    db = MagicMock()
    db.dresstemplate = MagicMock()
    db.dresstemplate.find_first = AsyncMock(side_effect=[tier2])

    cache = MagicMock()
    cache.key_template_select = MagicMock(return_value="tmpl:user-5:FORMAL")
    cache.get_json = AsyncMock(return_value=None)
    cache.set_json = AsyncMock()

    result = await select_best_template(
        user_id="user-5",
        body_label="TALL_AVERAGE",
        category="FORMAL",
        ethnicity="BLACK",
        consent_given=False,
        db=db,
        cache=cache,
    )

    assert result is not None
    assert result["id"] == "t4"
    assert db.dresstemplate.find_first.await_count == 1
    where_payload = db.dresstemplate.find_first.await_args.kwargs["where"]
    assert where_payload["ethnicity"] is None
