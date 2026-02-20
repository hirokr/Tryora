FROM python:3.13-slim

WORKDIR /app

RUN pip install --no-cache-dir \
    "alembic>=1.18.4" \
    "fastapi[standard]>=0.129.0" \
    "httpx>=0.28.1" \
    "loguru>=0.7.3" \
    "pydantic-settings>=2.13.1" \
    "sqlmodel>=0.0.35"

COPY . .

EXPOSE 8888

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8888"]
