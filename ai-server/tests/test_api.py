from fastapi.testclient import TestClient
from app.main import app 

client = TestClient(app)

def test_secure_endpoint_with_key():
    # Test successful access with your API Key header
    response = client.get("/data", headers={"X-API-Key": "server_a_key"})
    assert response.status_code == 200
    assert response.json() == {"message": "Hello Marketing-Server, here is your data."}

def test_secure_endpoint_no_key():
    # Test that unauthorized access is blocked (401)
    response = client.get("/data")
    assert response.status_code == 401
    assert "detail" in response.json()
