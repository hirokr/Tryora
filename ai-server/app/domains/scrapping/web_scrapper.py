import os
import re
import uuid
import asyncio
import hashlib
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from crewai_tools import SerperScrapeWebsiteTool

from ...core.config import settings
from ...core.logger import logger
from ...db.vectordb import VectorStore
from ..embeddings.openapi import open_api
from apify_client import ApifyClient

# ---------------------------------------------------------------------------
# Directory where scraped markdown files will be persisted
# ---------------------------------------------------------------------------
SCRAPED_CONTENT_DIR = Path(__file__).resolve().parent.parent.parent / "scraped_content"
SCRAPED_CONTENT_DIR.mkdir(parents=True, exist_ok=True)

# ---------------------------------------------------------------------------
# ChromaDB collection used for scraped-page embeddings
# ---------------------------------------------------------------------------
_vector_store = VectorStore(
    host=settings.CHROMADB_HOST,
    port=settings.CHROMADB_PORT,
    collection_name="web_scrapes",
)

# Maximum characters per embedding chunk (≈ ~500 tokens for text-embedding-3-small)
_CHUNK_SIZE = 2_000


class WebScrapperAPIFY:
    def __init__(self):
        self.api_key = settings.APIFY_APIKEY
        self.base_url = "https://api.apify.com/v2/acts/tryora~web-scraper/runs?token=" + self.api_key
        self.client = ApifyClient(self.api_key)

    async def scrape(self, url: str):
        run_input = { "profileUrls": [url] }
        run = self.client.actor("2SyF0bVxmgGr8IVCZ").call(run_input=run_input) 
        results = []
        for item in self.client.dataset(run["defaultDatasetId"]).iterate_items(): #type: ignore
            results.append(item)
        return results


# ---------------------------------------------------------------------------
# Helper utilities
# ---------------------------------------------------------------------------

def _slug_from_url(url: str) -> str:
    """Return a filesystem-safe slug derived from a URL."""
    slug = re.sub(r"https?://", "", url)
    slug = re.sub(r"[^\w\-]", "_", slug).strip("_")
    return slug[:80]  # limit file-name length


def _chunk_text(text: str, size: int = _CHUNK_SIZE) -> list[str]:
    """Split *text* into overlapping chunks of *size* characters."""
    chunks: list[str] = []
    overlap = size // 5  # 20 % overlap keeps sentence context across chunks
    start = 0
    while start < len(text):
        end = min(start + size, len(text))
        chunks.append(text[start:end])
        start += size - overlap
    return chunks


def _extract_title(markdown: str) -> str:
    """Try to pull the first H1/H2 heading out of markdown; fall back gracefully."""
    for line in markdown.splitlines():
        stripped = line.strip()
        if stripped.startswith("#"):
            return stripped.lstrip("#").strip()
    return "Untitled"


# ---------------------------------------------------------------------------
# Main scraper class
# ---------------------------------------------------------------------------

class WebScrapperSerper:
    """
    Scrape a website with Serper's scraping API, persist the result as a
    Markdown file, embed each content chunk via OpenRouter, and store the
    embeddings in ChromaDB.
    """

    def __init__(self):
        self._tool = SerperScrapeWebsiteTool()

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def scrape(
        self,
        url: str,
        include_markdown: bool = True,
        collection_name: Optional[str] = None,
    ) -> dict:
        """
        Scrape *url*, save to a .md file, embed the content, and upsert
        all chunks into ChromaDB.

        Parameters
        ----------
        url : str
            Target URL to scrape.
        include_markdown : bool
            Pass ``True`` (default) to request Serper's markdown
            formatting; ``False`` returns plain text.
        collection_name : str | None
            Override the ChromaDB collection name. Defaults to
            ``"web_scrapes"``.

        Returns
        -------
        dict with keys:
            - ``url``: original URL
            - ``title``: inferred page title
            - ``md_file``: path to the saved markdown file
            - ``word_count``: approximate word count of the scraped content
            - ``chunks_embedded``: number of chunks stored in ChromaDB
            - ``scraped_at``: ISO-8601 timestamp
        """
        logger.info(f"[WebScrapperSerper] Scraping: {url}")

        # 1. Fetch content via SerperScrapeWebsiteTool
        raw_content: str = await asyncio.get_event_loop().run_in_executor(
            None,
            lambda: self._tool.run(url=url, include_markdown=include_markdown),  # type: ignore[arg-type]
        )

        if not raw_content:
            raise ValueError(f"SerperScrapeWebsiteTool returned empty content for {url!r}")

        scraped_at = datetime.now(timezone.utc).isoformat()
        title = _extract_title(raw_content)
        word_count = len(raw_content.split())

        # 2. Build metadata header and save as .md ----------------------
        md_file_path = await self._save_markdown(
            url=url,
            title=title,
            content=raw_content,
            scraped_at=scraped_at,
        )

        # 3. Chunk → embed → store in ChromaDB --------------------------
        chunks_embedded = await self._embed_and_store(
            url=url,
            title=title,
            scraped_at=scraped_at,
            content=raw_content,
            collection_name=collection_name,
        )

        result = {
            "url": url,
            "title": title,
            "md_file": str(md_file_path),
            "word_count": word_count,
            "chunks_embedded": chunks_embedded,
            "scraped_at": scraped_at,
        }

        logger.info(
            f"[WebScrapperSerper] Done – {chunks_embedded} chunk(s) stored, "
            f"md file: {md_file_path}"
        )
        return result

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    async def _save_markdown(
        self,
        *,
        url: str,
        title: str,
        content: str,
        scraped_at: str,
    ) -> Path:
        """Write *content* to a Markdown file with a YAML-like front-matter block."""
        slug = _slug_from_url(url)
        # Suffix with a short hash so repeated scrapes don't collide
        url_hash = hashlib.md5(url.encode()).hexdigest()[:6]
        filename = f"{slug}_{url_hash}.md"
        file_path = SCRAPED_CONTENT_DIR / filename

        front_matter = (
            "---\n"
            f"title: \"{title}\"\n"
            f"source: \"{url}\"\n"
            f"scraped_at: \"{scraped_at}\"\n"
            f"word_count: {len(content.split())}\n"
            "---\n\n"
        )

        def _write():
            file_path.write_text(front_matter + content, encoding="utf-8")

        await asyncio.get_event_loop().run_in_executor(None, _write)
        logger.info(f"[WebScrapperSerper] Markdown saved → {file_path}")
        return file_path

    async def _embed_and_store(
        self,
        *,
        url: str,
        title: str,
        scraped_at: str,
        content: str,
        collection_name: Optional[str],
    ) -> int:
        """
        Split *content* into chunks, fetch embeddings for each, and upsert
        them into ChromaDB.  Returns the number of chunks stored.
        """
        # Use a per-call store if a custom collection is requested
        store = (
            VectorStore(
                host=settings.CHROMADB_HOST,
                port=settings.CHROMADB_PORT,
                collection_name=collection_name,
            )
            if collection_name
            else _vector_store
        )

        chunks = _chunk_text(content)
        url_prefix = hashlib.md5(url.encode()).hexdigest()[:8]

        # Embed all chunks concurrently for speed
        async def _embed_chunk(idx: int, chunk: str):
            embedding = await open_api.get_embeddings(chunk)
            doc_id = f"{url_prefix}_chunk_{idx}_{uuid.uuid4().hex[:6]}"
            metadata = {
                "source_url": url,
                "title": title,
                "scraped_at": scraped_at,
                "chunk_index": idx,
                "chunk_total": len(chunks),
            }
            # VectorStore.add_document is synchronous – offload to executor
            await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: store.add_document(
                    doc_id=doc_id,
                    embedding=embedding,
                    document=chunk,
                    metadata=metadata,
                ),
            )
            return idx

        tasks = [_embed_chunk(i, chunk) for i, chunk in enumerate(chunks)]
        await asyncio.gather(*tasks)
        return len(chunks)

