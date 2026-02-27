import httpx
from typing import List, Dict, Any
from ...core.config import settings 

class WebSearch:
    def __init__(self):
        self.api_key = settings.SERPER_APIKEY
        self.base_url = "https://google.serper.dev"
        self.headers = {
            "X-API-KEY": self.api_key,
            "Content-Type": "application/json"
        }

    async def search(self, query: str, num_results: int = 5) -> List[Dict[str, Any]]:
        """
        Performs a Google search via Serper and returns organic results.
        """
        payload = {
            "q": query,
            "num": num_results
        }

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    self.base_url, 
                    headers=self.headers, 
                    json=payload
                )
                response.raise_for_status()
                data = response.json()
                
                # Extracting organic search results
                return self._parse_results(data)
            except httpx.HTTPStatusError as e:
                # You might want to log this in a real app
                return [{"error": f"Search failed with status {e.response.status_code}"}]

    def _parse_results(self, data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Parses the raw JSON response into a cleaner format."""
        results = []
        for item in data.get("organic", []):
            results.append({
                "title": item.get("title"),
                "link": item.get("link"),
                "snippet": item.get("snippet"),
                "position": item.get("position")
            })
        return results
