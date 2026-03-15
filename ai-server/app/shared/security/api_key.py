from fastapi import HTTPException, Security
from fastapi.security import APIKeyHeader
from starlette import status
from os import getenv

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)

async def checkApiKey(incoming_key: str = Security(api_key_header)):
    
    # TODO: set up a more secure and scalable key management system, possibly using a database or environment variables
    valid_keys = {
        "server_a_key": "Marketing-Server", 
        "server_b_key": "Analytics-Engine"
    }
    
    master_key = getenv("API_KEY")
    if master_key:
        valid_keys[master_key] = "Master-Admin"

    server_name = valid_keys.get(incoming_key)
    
    if not incoming_key or not server_name:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized: Invalid or missing Server API Key"
        )
        
    return server_name
