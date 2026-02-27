from ...core.config import settings
from apify_client import ApifyClient

class WebScrapper:
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




