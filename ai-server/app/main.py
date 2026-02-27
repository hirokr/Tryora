# BASE
import json
from fastapi import FastAPI, Depends , HTTPException
from pathlib import Path
BASE_DIR = Path(__file__).resolve().parent

# CONFIG
from .middleware.secure_keys import checkApiKey
from .api.v1.health import router as health_router
from .middleware.audit_log import AuditLogMiddleware

# LLM APIs
from .LLM.openapi import open_api

# vector DB
# from .db.base import vector_db

#searching 
from .domains.searching.webSearch import WebSearch

#scraping
from .domains.scrapping.web_scrapper import WebScrapper


# Init FastAPI app
app = FastAPI(title="Tryora AI server", description="A server for managing AI operations for the Tryora platform", version="1.0.0")

app.add_middleware(AuditLogMiddleware)

app.include_router(health_router, prefix="/api/v1")

@app.get("/data")
async def get_data(server_name: str = Depends(checkApiKey)):
    return {"message": f"Hello {server_name}, here is your data."}

@app.get("/")
async def get():
    return {"message": "Hello, here is your data."}


@app.get('/search')
async def search(query: str):
    # Pass the actual query from the URL parameter
    web_search = WebSearch()
    results = await web_search.search(query=query, num_results=5)
    
    # Professional projects usually log the search for debugging
    print(f"Searching for: {query} | Results found: {len(results)}")
    
    return {"query": query, "results": results}


@app.get('/scrap')
async def scrape():
    web_scrapper = WebScrapper()
    url = '"https://www.linkedin.com/in/hirokrr"'
    results = await web_scrapper.scrape(url=url)
    
    # Professional projects usually log the search for debugging
    print(f"Scraping URL: {url} | Results found: {len(results)}")
    
    return {"url": url, "results": results}
