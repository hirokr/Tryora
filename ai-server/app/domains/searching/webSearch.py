import httpx
import json
from typing import List, Dict, Any
from ...core.config import settings 

class WebSearch:
    def __init__(self):
        # Always pull from settings, never hardcode keys in the class
        self.api_key = settings.SERPER_APIKEY 
        # Base URL must include the protocol
        self.base_url = settings.SERPER_BASE_URL
        self.headers = {
            "X-API-KEY": self.api_key,
            "Content-Type": "application/json"
        }

    async def search(self, query: str, num_results: int = 5) -> List[Dict[str, Any]]:
        """
        Performs a Google search via Serper.dev using async httpx.
        """
        payload = {
            "q": query,
            "num": num_results
        }
        
        # We use /search as per the Serper documentation
        endpoint = f"{self.base_url}/search"

        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                response = await client.post(
                    endpoint, 
                    headers=self.headers, 
                    content=json.dumps(payload)
                )
                response.raise_for_status()
                data = response.json()
                
                return self._parse_results(data)
            except httpx.HTTPStatusError as e:
                # Log this using your Loguru logger in the future
                return [{"error": f"Serper API error: {e.response.status_code}"}]
            except Exception as e:
                return [{"error": f"Unexpected error: {str(e)}"}]

    def _parse_results(self, data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Extracts organic results into a clean list."""
        return [
            {
                "title": item.get("title"),
                "link": item.get("link"),
                "snippet": item.get("snippet"),
                "position": item.get("position")
            }
            for item in data.get("organic", [])
        ]
