import json
import re

import requests

from app.core.config import get_settings
from app.models.dress_schema import DressSchema


class SearchService:
    def __init__(self) -> None:
        self.settings = get_settings()

    def search(self, query: str, max_results: int = 5) -> list[DressSchema]:
        raw_items = self._serper_search(query, max_results)
        return [self._extract_dress(item) for item in raw_items]

    def _serper_search(self, query: str, max_results: int) -> list[dict]:
        if not self.settings.serper_api_key:
            return []

        response = requests.post(
            "https://google.serper.dev/search",
            headers={
                "X-API-KEY": self.settings.serper_api_key,
                "Content-Type": "application/json",
            },
            json={"q": query, "num": max_results},
            timeout=20,
        )
        response.raise_for_status()
        data = response.json()
        return data.get("organic", [])

    def _extract_dress(self, item: dict) -> DressSchema:
        title = item.get("title", "Unknown dress")
        link = item.get("link", "")
        snippet = item.get("snippet", "")
        brand = self._extract_brand(title)

        return DressSchema(
            title=title,
            brand=brand,
            product_url=link,
            source="serper",
            description=snippet,
            price=self._extract_price(snippet),
            image_url=item.get("imageUrl"),
        )

    @staticmethod
    def _extract_brand(title: str) -> str | None:
        if "|" in title:
            return title.split("|")[-1].strip()
        if "-" in title:
            return title.split("-")[-1].strip()
        return None

    @staticmethod
    def _extract_price(text: str) -> float | None:
        match = re.search(r"(?:\$|USD\s?)(\d+(?:\.\d{1,2})?)", text)
        if not match:
            return None
        return float(match.group(1))
