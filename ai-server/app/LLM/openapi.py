from ..core.config import settings
from openai import AsyncOpenAI
  
class OpenAPI(AsyncOpenAI):
    def __init__(self):
      try:
        super().__init__(
            base_url="https://openrouter.ai/api/v1",
            api_key=settings.OPEN_ROUTER_APIKEY)
      except Exception as e:
        # TODO: add proper logging here
        print(f"Error initializing OpenAPI: {e}")

    async def get_embeddings(self, input: str, model: str = "openai/text-embedding-3-small") -> list[float]:
        
        text = input.replace("\n", " ")
        response = await self.embeddings.create(
          extra_headers={
            "HTTP-Referer": "http://localhost:8888", 
            "X-OpenRouter-Title": "Tryora AI Server", 
          },
          input=text, 
          model=model,
          encoding_format="float"
          )
        
        return response.data[0].embedding
    

open_api = OpenAPI()