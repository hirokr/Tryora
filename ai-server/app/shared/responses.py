def ok_response(data, message: str = "ok") -> dict:
    return {"status": "ok", "message": message, "data": data}