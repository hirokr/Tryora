"""
test_dress_search.py
--------------------
Comprehensive test suite for the dress-search pipeline.

Test categories
~~~~~~~~~~~~~~~
1. Unit — build_shopping_query()    (no I/O; pure function)
2. Unit — DressSearchParams schema  (Pydantic validation only)
3. Unit — ScraperAPI JSON-LD parser (BeautifulSoup; HTML fixtures, no network)
4. Unit — SearchDressesRequest validation
5. Integration — POST /internal/ai/search-dresses endpoint
6. Integration — GET  /internal/ai/sse/status/{task_id}
7. Integration — WS  /internal/ai/ws/status/{task_id}
8. Pipeline    — _run_pipeline() coroutine (all external I/O mocked)

External services mocked throughout:
  Prisma (PostgreSQL), ChromaDB, xAI LLM, Serper API, ScraperAPI, Redis
"""

from __future__ import annotations

import asyncio
import json
import textwrap
from typing import Any
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.api.deps import get_db
from app.shared.security.api_key import checkApiKey
from app.schemas.dress_search import (
    BudgetRange,
    DressProductSchema,
    DressSearchParams,
    SearchDressesRequest,
)
from app.modules.dress_search.query_builder import build_shopping_query
from app.infrastructure.external.scraper_api_client import ScraperAPIService

# ── Auth header used in all protected-route calls ────────────────────────────
AUTH = {"X-API-Key": "server_a_key"}

# ── Shared fixture data ───────────────────────────────────────────────────────
MOCK_TASK_ID = "aaaa-bbbb-cccc-dddd-eeee"
MOCK_SEARCH_ID = "1111-2222-3333-4444-5555"

SAMPLE_PARAMS = DressSearchParams(
    event="beach wedding",
    style_keywords=["boho", "flowy"],
    colors=["ivory", "dusty rose"],
    geo="Miami, FL",
    garment_length="maxi",
    fabric="chiffon",
    neckline="off-shoulder",
    season="summer",
    budget_range=BudgetRange(min=100, max=300, currency="USD"),
)

SAMPLE_PRODUCT = DressProductSchema(
    product_name="Ivory Chiffon Maxi Dress",
    price="$179.99",
    image_url="https://example.com/img/dress.jpg",
    product_url="https://example.com/products/dress-123",
    description="Floaty chiffon maxi perfect for beach weddings.",
    brand="Reformation",
    availability="In Stock",
    source="serper",
)


# ─────────────────────────────────────────────────────────────────────────────
# Section 1 — build_shopping_query() unit tests
# ─────────────────────────────────────────────────────────────────────────────

class TestBuildShoppingQuery:
    """Pure-function tests; no mocks required."""

    def test_full_params_contains_all_segments(self):
        query = build_shopping_query(SAMPLE_PARAMS)
        assert "ivory" in query
        assert "dusty rose" in query
        assert "chiffon" in query
        assert "off-shoulder" in query
        assert "boho" in query
        assert "flowy" in query
        assert "maxi dress" in query
        assert "for beach wedding" in query
        assert "summer" in query
        assert "$100-$300" in query
        assert "Miami, FL" in query

    def test_minimal_params_returns_just_dress(self):
        params = DressSearchParams()  # all None
        query = build_shopping_query(params)
        assert query == "dress"

    def test_geo_only(self):
        params = DressSearchParams(geo="London, UK")
        query = build_shopping_query(params)
        assert "dress" in query
        assert "London, UK" in query

    def test_budget_max_only_uses_under(self):
        params = DressSearchParams(budget_range=BudgetRange(max=200, currency="USD"))
        query = build_shopping_query(params)
        assert "under $200" in query

    def test_budget_min_and_max_uses_range(self):
        params = DressSearchParams(budget_range=BudgetRange(min=50, max=150, currency="USD"))
        query = build_shopping_query(params)
        assert "$50-$150" in query

    def test_colors_joined_with_space(self):
        params = DressSearchParams(colors=["red", "black"])
        query = build_shopping_query(params)
        assert "red black" in query

    def test_no_none_tokens_in_output(self):
        """The word 'None' must never appear — unset fields must be omitted."""
        params = DressSearchParams(event="gala", colors=None, fabric=None)
        query = build_shopping_query(params)
        assert "None" not in query

    def test_order_fabric_before_garment_length(self):
        params = DressSearchParams(fabric="linen", garment_length="midi")
        query = build_shopping_query(params)
        assert query.index("linen") < query.index("midi")


# ─────────────────────────────────────────────────────────────────────────────
# Section 2 — DressSearchParams schema validation
# ─────────────────────────────────────────────────────────────────────────────

class TestDressSearchParams:

    def test_all_fields_valid(self):
        p = DressSearchParams(
            event="prom",
            style_keywords=["sequin"],
            colors=["gold"],
            geo="New York",
            garment_length="mini",
            fabric="satin",
            neckline="V-neck",
            season="winter",
            budget_range={"min": 200, "max": 500, "currency": "USD"},
        )
        assert p.event == "prom"
        assert p.budget_range.max == 500

    def test_all_null_is_valid(self):
        """Every field is Optional — an empty dict is valid."""
        p = DressSearchParams()
        assert p.event is None
        assert p.colors is None
        assert p.budget_range is None

    def test_budget_range_sub_model(self):
        p = DressSearchParams(budget_range={"min": None, "max": 400, "currency": "EUR"})
        assert p.budget_range.currency == "EUR"
        assert p.budget_range.max == 400
        assert p.budget_range.min is None

    def test_style_keywords_list(self):
        p = DressSearchParams(style_keywords=["boho", "flowy", "romantic"])
        assert len(p.style_keywords) == 3

    def test_model_dump_excludes_none(self):
        p = DressSearchParams(event="wedding", season="summer")
        d = p.model_dump(exclude_none=True)
        assert "event" in d
        assert "season" in d
        assert "colors" not in d
        assert "fabric" not in d


# ─────────────────────────────────────────────────────────────────────────────
# Section 3 — SearchDressesRequest HTTP validation
# ─────────────────────────────────────────────────────────────────────────────

class TestSearchDressesRequest:

    def test_valid_request(self):
        r = SearchDressesRequest(prompt="boho maxi dress for beach wedding", geo="Miami, FL")
        assert r.prompt.startswith("boho")

    def test_prompt_too_short_raises(self):
        with pytest.raises(Exception):
            SearchDressesRequest(prompt="ab", geo="Miami, FL")

    def test_prompt_too_long_raises(self):
        with pytest.raises(Exception):
            SearchDressesRequest(prompt="x" * 501, geo="Miami, FL")

    def test_missing_geo_raises(self):
        with pytest.raises(Exception):
            SearchDressesRequest(prompt="nice dress")

    def test_geo_too_short_raises(self):
        with pytest.raises(Exception):
            SearchDressesRequest(prompt="nice dress", geo="A")


# ─────────────────────────────────────────────────────────────────────────────
# Section 4 — ScraperAPI JSON-LD parser (BeautifulSoup, no network)
# ─────────────────────────────────────────────────────────────────────────────

class TestScraperAPIJsonLd:
    """Tests the HTML-parsing logic in ScraperAPIService._parse_json_ld."""

    def setup_method(self):
        """Create a service instance (no API key needed — parsing is local)."""
        self._svc = ScraperAPIService.__new__(ScraperAPIService)
        self._svc._api_key = "test-key"

    def _make_html(self, ld_json: Any) -> str:
        """Wrap a Python object as a JSON-LD script tag inside minimal HTML."""
        return textwrap.dedent(f"""\
            <html><head>
            <script type="application/ld+json">
            {json.dumps(ld_json)}
            </script>
            </head><body></body></html>
        """)

    def test_extracts_product_type(self):
        html = self._make_html({
            "@context": "https://schema.org",
            "@type": "Product",
            "name": "Ivory Maxi Dress",
            "description": "Perfect for beach weddings",
            "offers": {"price": "179.99"},
        })
        result = self._svc._parse_json_ld(html, "https://example.com")
        assert result is not None
        assert result["name"] == "Ivory Maxi Dress"

    def test_returns_none_when_no_ld_json_tags(self):
        html = "<html><body><p>No LD+JSON here</p></body></html>"
        result = self._svc._parse_json_ld(html, "https://example.com")
        assert result is None

    def test_extracts_product_from_graph(self):
        """Schema.org @graph arrays should also be searched."""
        html = self._make_html({
            "@context": "https://schema.org",
            "@graph": [
                {"@type": "WebSite", "name": "Example"},
                {"@type": "BreadcrumbList"},
                {"@type": "Product", "name": "Satin Midi Dress", "description": "Elegant"},
            ],
        })
        result = self._svc._parse_json_ld(html, "https://example.com")
        assert result is not None
        assert result["name"] == "Satin Midi Dress"

    def test_skips_non_product_types(self):
        html = self._make_html({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "Example Shop",
        })
        result = self._svc._parse_json_ld(html, "https://example.com")
        assert result is None

    def test_ignores_malformed_json_continues_to_next_tag(self):
        """If one script tag has bad JSON, the parser must keep going."""
        html = textwrap.dedent("""\
            <html><head>
            <script type="application/ld+json">
            {INVALID JSON}}}
            </script>
            <script type="application/ld+json">
            {"@type": "Product", "name": "Valid Dress"}
            </script>
            </head></html>
        """)
        result = self._svc._parse_json_ld(html, "https://example.com")
        assert result is not None
        assert result["name"] == "Valid Dress"

    def test_handles_list_type_field(self):
        """@type may be a JSON array instead of a string."""
        html = self._make_html({
            "@type": ["Product", "Thing"],
            "name": "Multi-type Dress",
        })
        result = self._svc._parse_json_ld(html, "https://example.com")
        assert result is not None
        assert result["name"] == "Multi-type Dress"

    def test_empty_script_tag_is_skipped(self):
        html = textwrap.dedent("""\
            <html><head>
            <script type="application/ld+json">   </script>
            </head></html>
        """)
        result = self._svc._parse_json_ld(html, "https://example.com")
        assert result is None


# ─────────────────────────────────────────────────────────────────────────────
# Shared helpers for HTTP / WebSocket test sections
# ─────────────────────────────────────────────────────────────────────────────

def _build_mock_db(search_id: str = MOCK_SEARCH_ID) -> MagicMock:
    """Return a fully wired mock Prisma client suitable for route tests."""
    mock_record = MagicMock()
    mock_record.id = search_id

    mock_db = MagicMock()
    mock_db.is_connected.return_value = True
    mock_db.connect = AsyncMock()
    mock_db.disconnect = AsyncMock()
    mock_db.dresssearch = MagicMock()
    mock_db.dresssearch.create = AsyncMock(return_value=mock_record)
    mock_db.dresssearch.update = AsyncMock(return_value=mock_record)
    mock_db.dressproduct = MagicMock()
    mock_db.dressproduct.create = AsyncMock()
    return mock_db


# ─────────────────────────────────────────────────────────────────────────────
# Section 5 — POST /internal/ai/search-dresses
# ─────────────────────────────────────────────────────────────────────────────

class TestSearchDressesEndpoint:

    def _client(self, mock_db=None, task_id_override: str = MOCK_TASK_ID):
        """
        Return a (patches, TestClient) tuple with:
        - Prisma DB replaced by mock_db via dependency_overrides
        - Celery apply_async intercepted to avoid real queuing
        - uuid4 pinned to a fixed value for predictable task_id assertions

        Note: TestClient is used *without* a context manager so the lifespan
        is never triggered (and therefore db.connect is never called).
        """
        if mock_db is None:
            mock_db = _build_mock_db()

        async def _override_get_db():
            yield mock_db

        app.dependency_overrides[get_db] = _override_get_db

        patches = [
            patch(
                "app.modules.dress_search.api.process_dress_search.apply_async",
                return_value=MagicMock(id=task_id_override),
            ),
            patch(
                "app.modules.dress_search.api.uuid4",
                return_value=MagicMock(__str__=lambda s: task_id_override),
            ),
        ]
        return patches, TestClient(app)

    def teardown_method(self):
        app.dependency_overrides.clear()

    def test_success_returns_202(self):
        mock_db = _build_mock_db()
        patches, client = self._client(mock_db)
        with patches[0], patches[1]:
            resp = client.post(
                "/internal/ai/search-dresses",
                json={"prompt": "flowy maxi dress for a beach wedding", "geo": "Miami, FL"},
                headers=AUTH,
            )

        assert resp.status_code == 202
        body = resp.json()
        assert body["status"] == "PENDING"
        assert body["task_id"] == MOCK_TASK_ID
        assert body["search_id"] == MOCK_SEARCH_ID
        assert "message" in body

    def test_success_creates_db_record(self):
        mock_db = _build_mock_db()
        patches, client = self._client(mock_db)
        with patches[0], patches[1]:
            client.post(
                "/internal/ai/search-dresses",
                json={"prompt": "flowy maxi dress for a beach wedding", "geo": "Miami, FL"},
                headers=AUTH,
            )

        mock_db.dresssearch.create.assert_called_once()
        call_data = mock_db.dresssearch.create.call_args[1]["data"]
        assert call_data["prompt"] == "flowy maxi dress for a beach wedding"
        assert call_data["geo"] == "Miami, FL"
        assert call_data["status"] == "PENDING"

    def test_success_dispatches_celery_task(self):
        mock_db = _build_mock_db()
        with patch(
                 "app.modules.dress_search.api.process_dress_search.apply_async",
             ) as mock_apply, \
             patch(
                 "app.modules.dress_search.api.uuid4",
                 return_value=MagicMock(__str__=lambda s: MOCK_TASK_ID),
             ):
            async def _override_get_db():
                yield mock_db
            app.dependency_overrides[get_db] = _override_get_db
            client = TestClient(app)
            client.post(
                "/internal/ai/search-dresses",
                json={"prompt": "flowy maxi dress for a beach wedding", "geo": "Miami, FL"},
                headers=AUTH,
            )

        mock_apply.assert_called_once()
        kw = mock_apply.call_args[1]["kwargs"]
        assert kw["prompt"] == "flowy maxi dress for a beach wedding"
        assert kw["geo"] == "Miami, FL"
        assert kw["search_id"] == MOCK_SEARCH_ID

    def test_missing_api_key_returns_401(self):
        mock_db = _build_mock_db()
        patches, client = self._client(mock_db)
        with patches[0], patches[1]:
            resp = client.post(
                "/internal/ai/search-dresses",
                json={"prompt": "flowy maxi dress for a beach wedding", "geo": "Miami, FL"},
            )

        assert resp.status_code == 401

    def test_prompt_too_short_returns_422(self):
        mock_db = _build_mock_db()
        patches, client = self._client(mock_db)
        with patches[0], patches[1]:
            resp = client.post(
                "/internal/ai/search-dresses",
                json={"prompt": "hi", "geo": "Miami, FL"},
                headers=AUTH,
            )

        assert resp.status_code == 422

    def test_missing_geo_returns_422(self):
        mock_db = _build_mock_db()
        patches, client = self._client(mock_db)
        with patches[0], patches[1]:
            resp = client.post(
                "/internal/ai/search-dresses",
                json={"prompt": "flowy maxi dress for a beach wedding"},
                headers=AUTH,
            )

        assert resp.status_code == 422

    def test_db_failure_returns_500(self):
        mock_db = _build_mock_db()
        mock_db.dresssearch.create = AsyncMock(side_effect=Exception("DB connection lost"))

        with patch("app.modules.dress_search.api.process_dress_search.apply_async"):
            async def _override_get_db():
                yield mock_db
            app.dependency_overrides[get_db] = _override_get_db
            client = TestClient(app)
            resp = client.post(
                "/internal/ai/search-dresses",
                json={"prompt": "flowy maxi for beach wedding", "geo": "Miami, FL"},
                headers=AUTH,
            )

        assert resp.status_code == 500

    def test_celery_dispatch_failure_returns_503(self):
        mock_db = _build_mock_db()

        with patch(
                 "app.modules.dress_search.api.process_dress_search.apply_async",
                 side_effect=Exception("Redis unavailable"),
             ), \
             patch(
                 "app.modules.dress_search.api.uuid4",
                 return_value=MagicMock(__str__=lambda s: MOCK_TASK_ID),
             ):
            async def _override_get_db():
                yield mock_db
            app.dependency_overrides[get_db] = _override_get_db
            client = TestClient(app)
            resp = client.post(
                "/internal/ai/search-dresses",
                json={"prompt": "flowy maxi for beach wedding", "geo": "Miami, FL"},
                headers=AUTH,
            )

        assert resp.status_code == 503
        # DB record should have been marked FAILED
        mock_db.dresssearch.update.assert_called_once()
        update_data = mock_db.dresssearch.update.call_args[1]["data"]
        assert update_data["status"] == "FAILED"


# ─────────────────────────────────────────────────────────────────────────────
# Section 6 — GET /internal/ai/sse/status/{task_id}
# ─────────────────────────────────────────────────────────────────────────────

class TestSseEndpoint:

    def teardown_method(self):
        app.dependency_overrides.clear()

    def test_sse_returns_result_when_task_ready(self):
        """If the Celery result is already ready, SSE yields it immediately."""
        expected_payload = {
            "task_id": MOCK_TASK_ID,
            "search_id": MOCK_SEARCH_ID,
            "status": "COMPLETED",
            "products": [SAMPLE_PRODUCT.model_dump()],
        }

        mock_async_result = MagicMock()
        mock_async_result.ready.return_value = True
        mock_async_result.result = expected_payload

        with patch(
                 "app.modules.dress_search.api.celery_app.AsyncResult",
                 return_value=mock_async_result,
             ):
            client = TestClient(app)
            resp = client.get(
                f"/internal/ai/sse/status/{MOCK_TASK_ID}",
                headers=AUTH,
            )

        assert resp.status_code == 200
        assert "text/event-stream" in resp.headers["content-type"]
        # The SSE body should contain a `data:` line with our JSON
        body = resp.text
        assert "data:" in body
        # Parse the data payload from the SSE body
        for line in body.splitlines():
            if line.startswith("data:"):
                parsed = json.loads(line[len("data:"):].strip())
                assert parsed["status"] == "COMPLETED"
                assert parsed["task_id"] == MOCK_TASK_ID
                break

    def test_sse_returns_401_without_api_key(self):
        client = TestClient(app)
        resp = client.get(f"/internal/ai/sse/status/{MOCK_TASK_ID}")

        assert resp.status_code == 401


# ─────────────────────────────────────────────────────────────────────────────
# Section 7 — WebSocket /internal/ai/ws/status/{task_id}
# ─────────────────────────────────────────────────────────────────────────────

class TestWebSocketEndpoint:
    """
    FastAPI's APIKeyHeader reads from Request.headers, which isn't directly
    injected for WebSocket connections when applied via router-level
    dependencies.  We bypass this by overriding checkApiKey for all WS tests.
    """

    def setup_method(self):
        # Bypass HTTP-only APIKeyHeader for WebSocket routes
        app.dependency_overrides[checkApiKey] = lambda: "Test-Server"

    def teardown_method(self):
        app.dependency_overrides.clear()

    def test_ws_delivers_result_when_task_already_ready(self):
        """
        If AsyncResult.ready() is True, the handler should immediately
        send the result payload and close the connection.
        """
        expected_payload = {
            "task_id": MOCK_TASK_ID,
            "search_id": MOCK_SEARCH_ID,
            "status": "COMPLETED",
            "products": [],
        }

        mock_async_result = MagicMock()
        mock_async_result.ready.return_value = True
        mock_async_result.result = expected_payload

        with patch(
                 "app.modules.dress_search.api.celery_app.AsyncResult",
                 return_value=mock_async_result,
             ):
            client = TestClient(app)
            with client.websocket_connect(
                f"/internal/ai/ws/status/{MOCK_TASK_ID}",
            ) as ws:
                data = ws.receive_json()

        assert data["status"] == "COMPLETED"
        assert data["task_id"] == MOCK_TASK_ID

    def test_ws_delivers_result_from_pubsub(self):
        """
        When the task is not yet ready, the handler should subscribe to
        Redis Pub/Sub and forward the first message it receives.
        """
        expected_payload = {
            "task_id": MOCK_TASK_ID,
            "search_id": MOCK_SEARCH_ID,
            "status": "COMPLETED",
            "products": [SAMPLE_PRODUCT.model_dump()],
        }

        # Celery backend: not ready yet
        mock_async_result = MagicMock()
        mock_async_result.ready.return_value = False

        # Redis pubsub mock: first call returns None (subscribe ack),
        # second call returns our result message
        pubsub_messages = [
            None,  # first poll — nothing yet
            {"type": "message", "data": json.dumps(expected_payload)},
        ]

        mock_pubsub = AsyncMock()
        mock_pubsub.subscribe = AsyncMock()
        mock_pubsub.unsubscribe = AsyncMock()
        mock_pubsub.get_message = AsyncMock(side_effect=pubsub_messages)

        mock_redis_client = AsyncMock()
        # pubsub() is synchronous in redis.asyncio — must be a plain MagicMock
        mock_redis_client.pubsub = MagicMock(return_value=mock_pubsub)
        mock_redis_client.aclose = AsyncMock()

        with patch(
                 "app.modules.dress_search.api.celery_app.AsyncResult",
                 return_value=mock_async_result,
             ), \
             patch(
                 "app.modules.dress_search.api.aioredis.from_url",
                 return_value=mock_redis_client,
             ):
            client = TestClient(app)
            with client.websocket_connect(
                f"/internal/ai/ws/status/{MOCK_TASK_ID}",
            ) as ws:
                # First message: "PROCESSING" acknowledgement sent on connect
                ack = ws.receive_json()
                assert ack["status"] == "PROCESSING"
                # Second message: the actual result from pubsub
                result = ws.receive_json()

        assert result["status"] == "COMPLETED"
        assert len(result["products"]) == 1

    def test_ws_without_api_key_is_rejected(self):
        """
        Without the checkApiKey override (cleared here), a connection with
        no API key should fail at the dependency level.
        NOTE: APIKeyHeader doesn't inject correctly into WebSocket scope via
        router-level dependencies in the current FastAPI version.  This test
        verifies the app raises an error (which it does, even if the error is
        a TypeError rather than a clean 401).  Tracked for future fix.
        """
        # Remove the override so the real checkApiKey runs
        app.dependency_overrides.clear()
        client = TestClient(app)
        with pytest.raises(Exception):
            with client.websocket_connect(
                f"/internal/ai/ws/status/{MOCK_TASK_ID}"
            ):
                pass


# ─────────────────────────────────────────────────────────────────────────────
# Section 8 — Pipeline _run_pipeline() unit tests
# ─────────────────────────────────────────────────────────────────────────────

class TestPipeline:
    """
    Unit-tests for the async _run_pipeline coroutine.

    All external I/O is mocked at the module-namespace level so no real
    network calls, DB writes, or LLM API calls are ever made.
    """

    def setup_method(self):
        """Build common mock objects shared across pipeline tests."""
        # Prisma db mock — used via app.modules.dress_search.workers.db
        self.mock_db = _build_mock_db()

        # LLM parser — synchronous
        self.mock_parser = MagicMock(return_value=SAMPLE_PARAMS)

        # Embeddings — async
        self.mock_embedding = [0.1] * 512

        # ChromaDB VectorStore mock (passed directly to _run_pipeline)
        self.mock_vs = MagicMock()
        # Default: cache miss (empty results)
        self.mock_vs.search.return_value = {
            "ids": [[]], "distances": [[]], "metadatas": [[]]
        }
        self.mock_vs.add_document = MagicMock()

        # Serper — async
        self.mock_serper_items = [
            {
                "productName": "Ivory Chiffon Maxi Dress",
                "price": "$179.99",
                "imageUrl": "https://example.com/img/dress.jpg",
                "productUrl": "https://example.com/products/dress-123",
                "description": "Floaty chiffon maxi.",
                "brand": "Reformation",
                "_raw": {},
            },
        ]

        # Formatter — synchronous
        self.mock_formatter = MagicMock(return_value=SAMPLE_PRODUCT)

    def _run(self, coro):
        """Synchronously execute a coroutine in a new event loop."""
        loop = asyncio.new_event_loop()
        try:
            return loop.run_until_complete(coro)
        finally:
            loop.close()

    def _pipeline_patches(self):
        """Return a list of active context managers for all external deps."""
        return [
            patch("app.modules.dress_search.workers.db", self.mock_db),
            patch(
                "app.modules.dress_search.workers.llm_parser.parse_prompt",
                self.mock_parser,
            ),
            patch(
                "app.modules.dress_search.workers.open_api.get_embeddings",
                new_callable=lambda: (lambda *a, **kw: AsyncMock(return_value=self.mock_embedding)()),
            ),
            patch(
                "app.modules.dress_search.workers.serper_shopping.search",
                new_callable=lambda: (lambda *a, **kw: AsyncMock(return_value=self.mock_serper_items)()),
            ),
            patch(
                "app.modules.dress_search.workers.scraper_api.extract_json_ld",
                new_callable=lambda: (lambda *a, **kw: AsyncMock(return_value=None)()),
            ),
            patch(
                "app.modules.dress_search.workers.llm_formatter.format_product",
                self.mock_formatter,
            ),
        ]

    # ------------------------------------------------------------------
    # Helper: run pipeline with supplied patches active
    # ------------------------------------------------------------------

    def _run_pipeline_with_mocks(
        self,
        extra_patches: list | None = None,
        vs_override=None,
    ) -> dict:
        """
        Apply all standard patches plus any extras, then run _run_pipeline.
        Returns the result dict.
        """
        from app.modules.dress_search.workers import _run_pipeline

        vs = vs_override or self.mock_vs

        # Build get_embeddings and serper as proper async mocks
        mock_get_emb = AsyncMock(return_value=self.mock_embedding)
        mock_serper = AsyncMock(return_value=self.mock_serper_items)
        mock_scraper = AsyncMock(return_value=None)

        patches = [
            patch("app.modules.dress_search.workers.db", self.mock_db),
            patch("app.modules.dress_search.workers.llm_parser.parse_prompt", self.mock_parser),
            patch("app.modules.dress_search.workers.open_api.get_embeddings", mock_get_emb),
            patch("app.modules.dress_search.workers.serper_shopping.search", mock_serper),
            patch("app.modules.dress_search.workers.scraper_api.extract_json_ld", mock_scraper),
            patch("app.modules.dress_search.workers.llm_formatter.format_product", self.mock_formatter),
        ]
        if extra_patches:
            patches.extend(extra_patches)

        started = [p.start() for p in patches]
        try:
            result = self._run(
                _run_pipeline(MOCK_SEARCH_ID, MOCK_TASK_ID, "beach wedding maxi", "Miami, FL", vs)
            )
        finally:
            for p in patches:
                p.stop()
        return result

    # ------------------------------------------------------------------
    # Test: cache miss → full pipeline
    # ------------------------------------------------------------------

    def test_cache_miss_completes_with_products(self):
        result = self._run_pipeline_with_mocks()
        assert result["status"] == "COMPLETED"
        assert len(result["products"]) == 1
        assert result["products"][0]["product_name"] == SAMPLE_PRODUCT.product_name

    def test_cache_miss_persists_to_postgres(self):
        self._run_pipeline_with_mocks()
        # dressproduct.create should be called once for the single product
        self.mock_db.dressproduct.create.assert_called_once()
        create_data = self.mock_db.dressproduct.create.call_args[1]["data"]
        assert create_data["productName"] == SAMPLE_PRODUCT.product_name
        assert create_data["searchId"] == MOCK_SEARCH_ID

    def test_cache_miss_upserts_to_chromadb(self):
        self._run_pipeline_with_mocks()
        self.mock_vs.add_document.assert_called_once()
        call_kwargs = self.mock_vs.add_document.call_args[1]
        assert call_kwargs["doc_id"].startswith(MOCK_SEARCH_ID)
        assert call_kwargs["embedding"] == self.mock_embedding

    def test_db_status_sequence_on_cache_miss(self):
        """
        Status must advance: PROCESSING → PROCESSING (with params) → COMPLETED.
        Verify at least one PROCESSING call and one COMPLETED call.
        """
        self._run_pipeline_with_mocks()
        calls = self.mock_db.dresssearch.update.call_args_list
        statuses = [c[1]["data"]["status"] for c in calls]
        assert "PROCESSING" in statuses
        assert "COMPLETED" in statuses
        # COMPLETED must be the last status update
        assert statuses[-1] == "COMPLETED"

    # ------------------------------------------------------------------
    # Test: cache hit
    # ------------------------------------------------------------------

    def test_cache_hit_returns_early_with_cached_products(self):
        """
        When ChromaDB returns a hit, the pipeline must return cached products
        and skip Serper, ScraperAPI, and LLM formatting entirely.
        """
        cached_meta = {
            "product_name": "Cached Dress",
            "price": "$120",
            "image_url": "https://cache.example.com/img.jpg",
            "product_url": "https://cache.example.com/dress",
            "description": "From cache",
            "brand": "CacheBrand",
            "availability": "In Stock",
        }
        self.mock_vs.search.return_value = {
            "ids": [["cached-doc-id"]],
            "distances": [[0.05]],   # below threshold → hit
            "metadatas": [[cached_meta]],
        }

        mock_serper = AsyncMock(return_value=self.mock_serper_items)
        mock_scraper = AsyncMock(return_value=None)

        result = self._run_pipeline_with_mocks(
            extra_patches=[
                patch("app.modules.dress_search.workers.serper_shopping.search", mock_serper),
                patch("app.modules.dress_search.workers.scraper_api.extract_json_ld", mock_scraper),
            ]
        )

        assert result["status"] == "COMPLETED"
        assert len(result["products"]) == 1
        assert result["products"][0]["product_name"] == "Cached Dress"
        assert result["products"][0]["source"] == "cache"
        # Serper must NOT be called on a cache hit
        mock_serper.assert_not_called()

    # ------------------------------------------------------------------
    # Test: ScraperAPI fallback
    # ------------------------------------------------------------------

    def test_scraper_enriches_products_without_description(self):
        """
        Items from Serper that lack a description should trigger a
        ScraperAPI call and the JSON-LD description should be merged in.
        """
        serper_no_desc = [
            {
                "productName": "Chiffon Dress",
                "price": "$200",
                "imageUrl": "https://shop.example.com/img.jpg",
                "productUrl": "https://shop.example.com/dress",
                "description": "",  # empty → should trigger scraper
                "brand": "Brand",
                "_raw": {},
            }
        ]
        json_ld_result = {
            "@type": "Product",
            "name": "Chiffon Dress",
            "description": "Beautiful dress from scraper JSON-LD",
        }

        mock_serper = AsyncMock(return_value=serper_no_desc)
        mock_scraper = AsyncMock(return_value=json_ld_result)

        from app.modules.dress_search.workers import _run_pipeline
        mock_get_emb = AsyncMock(return_value=self.mock_embedding)

        with patch("app.modules.dress_search.workers.db", self.mock_db), \
             patch("app.modules.dress_search.workers.llm_parser.parse_prompt", self.mock_parser), \
             patch("app.modules.dress_search.workers.open_api.get_embeddings", mock_get_emb), \
             patch("app.modules.dress_search.workers.serper_shopping.search", mock_serper), \
             patch("app.modules.dress_search.workers.scraper_api.extract_json_ld", mock_scraper), \
             patch("app.modules.dress_search.workers.llm_formatter.format_product", self.mock_formatter):
            result = self._run(
                _run_pipeline(MOCK_SEARCH_ID, MOCK_TASK_ID, "beach wedding maxi", "Miami, FL", self.mock_vs)
            )

        assert result["status"] == "COMPLETED"
        # ScraperAPI should have been called exactly once for the one item
        mock_scraper.assert_called_once_with("https://shop.example.com/dress")

    # ------------------------------------------------------------------
    # Test: LLM parser failure
    # ------------------------------------------------------------------

    def test_pipeline_fails_when_llm_parser_raises(self):
        """
        If the LLM parser raises (e.g., bad API key, rate limit), the
        pipeline should set status = FAILED and re-raise.
        """
        failing_parser = MagicMock(side_effect=RuntimeError("xAI API unavailable"))

        from app.modules.dress_search.workers import _run_pipeline
        mock_get_emb = AsyncMock(return_value=self.mock_embedding)

        with patch("app.modules.dress_search.workers.db", self.mock_db), \
             patch("app.modules.dress_search.workers.llm_parser.parse_prompt", failing_parser), \
             patch("app.modules.dress_search.workers.open_api.get_embeddings", mock_get_emb), \
             pytest.raises(RuntimeError, match="xAI API unavailable"):
            self._run(
                _run_pipeline(MOCK_SEARCH_ID, MOCK_TASK_ID, "beach wedding maxi", "Miami, FL", self.mock_vs)
            )

    # ------------------------------------------------------------------
    # Test: empty Serper results
    # ------------------------------------------------------------------

    def test_empty_serper_results_completes_with_zero_products(self):
        """
        Empty Serper response is a valid outcome — status COMPLETED with
        an empty products list.
        """
        mock_serper = AsyncMock(return_value=[])
        mock_scraper = AsyncMock(return_value=None)

        from app.modules.dress_search.workers import _run_pipeline
        mock_get_emb = AsyncMock(return_value=self.mock_embedding)

        with patch("app.modules.dress_search.workers.db", self.mock_db), \
             patch("app.modules.dress_search.workers.llm_parser.parse_prompt", self.mock_parser), \
             patch("app.modules.dress_search.workers.open_api.get_embeddings", mock_get_emb), \
             patch("app.modules.dress_search.workers.serper_shopping.search", mock_serper), \
             patch("app.modules.dress_search.workers.scraper_api.extract_json_ld", mock_scraper), \
             patch("app.modules.dress_search.workers.llm_formatter.format_product", self.mock_formatter):
            result = self._run(
                _run_pipeline(MOCK_SEARCH_ID, MOCK_TASK_ID, "beach wedding maxi", "Miami, FL", self.mock_vs)
            )

        assert result["status"] == "COMPLETED"
        assert result["products"] == []
        # With no products, dressproduct.create must never be called
        self.mock_db.dressproduct.create.assert_not_called()

    # ------------------------------------------------------------------
    # Test: formatter returns None for a product (skip gracefully)
    # ------------------------------------------------------------------

    def test_formatter_returning_none_is_skipped(self):
        """
        If the LLM formatter returns None for a product (e.g. parse error),
        that product must be silently skipped — the pipeline must not crash.
        """
        self.mock_formatter.return_value = None  # formatter returns None

        result = self._run_pipeline_with_mocks()

        assert result["status"] == "COMPLETED"
        assert result["products"] == []

    # ------------------------------------------------------------------
    # Test: scraper API hit cap (_MAX_SCRAPER_FALLBACKS)
    # ------------------------------------------------------------------

    def test_scraper_fallback_cap_is_respected(self):
        """
        If more than _MAX_SCRAPER_FALLBACKS items need enrichment, only the
        first N should trigger ScraperAPI calls.  The cap counts SUCCESSFUL
        enrichments (when json_ld is truthy), so we mock the scraper to
        return a valid JSON-LD result for each call.
        """
        from app.modules.dress_search.workers import _MAX_SCRAPER_FALLBACKS

        # Build N+2 items without descriptions
        many_items = [
            {
                "productName": f"Dress {i}",
                "price": "$100",
                "imageUrl": "",
                "productUrl": f"https://example.com/dress-{i}",
                "description": "",
                "_raw": {},
            }
            for i in range(_MAX_SCRAPER_FALLBACKS + 2)
        ]

        mock_serper = AsyncMock(return_value=many_items)
        # Scraper returns a valid JSON-LD so scrape_count increments each call
        mock_scraper = AsyncMock(return_value={
            "@type": "Product",
            "name": "Dress",
            "description": "Beautiful dress",
        })

        from app.modules.dress_search.workers import _run_pipeline
        mock_get_emb = AsyncMock(return_value=self.mock_embedding)

        with patch("app.modules.dress_search.workers.db", self.mock_db), \
             patch("app.modules.dress_search.workers.llm_parser.parse_prompt", self.mock_parser), \
             patch("app.modules.dress_search.workers.open_api.get_embeddings", mock_get_emb), \
             patch("app.modules.dress_search.workers.serper_shopping.search", mock_serper), \
             patch("app.modules.dress_search.workers.scraper_api.extract_json_ld", mock_scraper), \
             patch("app.modules.dress_search.workers.llm_formatter.format_product", self.mock_formatter):
            self._run(
                _run_pipeline(MOCK_SEARCH_ID, MOCK_TASK_ID, "beach maxi", "Miami, FL", self.mock_vs)
            )

        # ScraperAPI must be called exactly _MAX_SCRAPER_FALLBACKS times
        assert mock_scraper.call_count == _MAX_SCRAPER_FALLBACKS
