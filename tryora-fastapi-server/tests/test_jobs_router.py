from __future__ import annotations

from typing import Any
from unittest.mock import Mock

from fastapi.testclient import TestClient

from app.main import app
from app.routers import jobs as jobs_router


class _SessionCtx:
    def __init__(self, db: Any) -> None:
        self._db = db

    async def __aenter__(self) -> Any:
        return self._db

    async def __aexit__(self, exc_type, exc, tb) -> bool:
        return False


def test_post_dress_search_job_returns_pending(monkeypatch) -> None:
    created: dict[str, Any] = {}

    class _AiJobModel:
        async def create(self, data: dict[str, Any]) -> dict[str, Any]:
            created.update(data)
            return data

    class _FakeDb:
        aijob = _AiJobModel()

    delay_mock = Mock()
    monkeypatch.setattr(
        "app.routers.jobs.prisma_session",
        lambda: _SessionCtx(_FakeDb()),
    )
    monkeypatch.setitem(
        jobs_router.JOB_TASK_MAP,
        "DRESS_SEARCH",
        type("Task", (), {"delay": delay_mock})(),
    )

    client = TestClient(app)
    payload = {"userId": "user-1", "prompt": "red evening dress"}

    response = client.post(
        "/jobs",
        json={"jobType": "DRESS_SEARCH", "payload": payload},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "PENDING"
    assert isinstance(body["jobId"], str)
    assert len(body["jobId"]) > 0

    assert created["id"] == body["jobId"]
    assert created["job_type"] == "DRESS_SEARCH"
    assert created["status"] == "PENDING"
    assert created["payload"] == payload

    delay_mock.assert_called_once_with(body["jobId"], payload)


def test_get_job_status_returns_job(monkeypatch) -> None:
    job_id = "8e0362cf-5f78-4c30-8b6d-3c656ec16975"

    class _AiJobModel:
        async def find_unique(self, where: dict[str, Any]) -> dict[str, Any] | None:
            assert where == {"id": job_id}
            return {
                "id": job_id,
                "status": "COMPLETED",
                "result_url": "https://r2.example.com/results/scene.png",
                "error": None,
            }

    class _FakeDb:
        aijob = _AiJobModel()

    monkeypatch.setattr(
        "app.routers.jobs.prisma_session",
        lambda: _SessionCtx(_FakeDb()),
    )

    client = TestClient(app)
    response = client.get(f"/jobs/{job_id}")

    assert response.status_code == 200
    assert response.json() == {
        "jobId": job_id,
        "status": "COMPLETED",
        "resultUrl": "https://r2.example.com/results/scene.png",
        "error": None,
    }


def test_post_unknown_job_type_returns_400() -> None:
    client = TestClient(app)
    response = client.post(
        "/jobs",
        json={"jobType": "NOT_A_JOB", "payload": {}},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Unknown jobType"
