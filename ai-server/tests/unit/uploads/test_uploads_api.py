"""Detailed endpoint tests for uploads API (validation + runtime failures)."""

from __future__ import annotations

import sys
import types
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
import pytest_asyncio
from fastapi import FastAPI
from httpx import ASGITransport
from httpx import AsyncClient

# app.infrastructure.storage package imports app.infrastructure.storage.s3,
# which is missing in this branch. Stub it so uploads router can be imported.
if "app.infrastructure.storage.s3" not in sys.modules:
    s3_stub = types.ModuleType("app.infrastructure.storage.s3")
    setattr(s3_stub, "S3Service", object)
    setattr(s3_stub, "s3_service", object())
    sys.modules["app.infrastructure.storage.s3"] = s3_stub

from app.modules.uploads.api import router as uploads_router
from app.shared.security.jwt import TokenPayload, get_current_user


@pytest_asyncio.fixture
async def uploads_client() -> AsyncClient:
    app = FastAPI()
    app.include_router(uploads_router, prefix="/api")

    async def _fake_user() -> TokenPayload:
        return TokenPayload(user_id="user-123", email="user@example.com", role="USER")

    app.dependency_overrides[get_current_user] = _fake_user

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        yield client


class TestUploadDressImage:
    @pytest.mark.asyncio
    async def test_rejects_unsupported_mime_type(self, uploads_client: AsyncClient):
        files = {"file": ("note.txt", b"hello", "text/plain")}

        response = await uploads_client.post(
            "/api/3d/upload/dress-image",
            files=files,
        )

        assert response.status_code == 415
        assert "Unsupported file type" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_rejects_payload_larger_than_10mb(self, uploads_client: AsyncClient):
        oversized = b"x" * (10 * 1024 * 1024 + 1)
        files = {"file": ("dress.jpg", oversized, "image/jpeg")}

        response = await uploads_client.post(
            "/api/3d/upload/dress-image",
            files=files,
        )

        assert response.status_code == 413
        assert "10MB" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_upload_success_returns_sha_key_and_presigned_url(
        self,
        uploads_client: AsyncClient,
    ):
        fake_storage = MagicMock()
        fake_storage.key_dress_upload = MagicMock(return_value="uploads/dresses/user-123/abc.jpg")
        fake_storage.upload_bytes = AsyncMock()
        fake_storage.generate_presigned_url = AsyncMock(return_value="https://cdn.example.com/presigned")

        with (
            patch("app.modules.uploads.api.storage_service", fake_storage),
            patch("app.modules.uploads.api._strip_exif", return_value=b"clean-image"),
        ):
            files = {"file": ("dress.jpg", b"raw-image", "image/jpeg")}
            response = await uploads_client.post(
                "/api/3d/upload/dress-image",
                files=files,
            )

        assert response.status_code == 201
        body = response.json()
        assert body["s3Key"] == "uploads/dresses/user-123/abc.jpg"
        assert body["presignedUrl"] == "https://cdn.example.com/presigned"
        assert body["contentType"] == "image/jpeg"
        assert body["sizeBytes"] == len(b"clean-image")
        fake_storage.upload_bytes.assert_called_once()

    @pytest.mark.asyncio
    async def test_upload_returns_500_when_storage_upload_fails(
        self,
        uploads_client: AsyncClient,
    ):
        fake_storage = MagicMock()
        fake_storage.key_dress_upload = MagicMock(return_value="uploads/dresses/user-123/abc.jpg")
        fake_storage.upload_bytes = AsyncMock(side_effect=RuntimeError("bucket down"))
        fake_storage.generate_presigned_url = AsyncMock(return_value="https://cdn.example.com/presigned")

        with (
            patch("app.modules.uploads.api.storage_service", fake_storage),
            patch("app.modules.uploads.api._strip_exif", return_value=b"clean-image"),
        ):
            files = {"file": ("dress.jpg", b"raw-image", "image/jpeg")}
            response = await uploads_client.post(
                "/api/3d/upload/dress-image",
                files=files,
            )

        assert response.status_code == 500
        assert response.json()["detail"] == "Upload failed"

    @pytest.mark.asyncio
    async def test_upload_still_succeeds_when_presign_fails(
        self,
        uploads_client: AsyncClient,
    ):
        fake_storage = MagicMock()
        fake_storage.key_dress_upload = MagicMock(return_value="uploads/dresses/user-123/abc.jpg")
        fake_storage.upload_bytes = AsyncMock()
        fake_storage.generate_presigned_url = AsyncMock(side_effect=RuntimeError("presign down"))

        with (
            patch("app.modules.uploads.api.storage_service", fake_storage),
            patch("app.modules.uploads.api._strip_exif", return_value=b"clean-image"),
        ):
            files = {"file": ("dress.png", b"raw-image", "image/png")}
            response = await uploads_client.post(
                "/api/3d/upload/dress-image",
                files=files,
            )

        assert response.status_code == 201
        assert response.json()["presignedUrl"] is None


class TestDeleteUpload:
    @pytest.mark.asyncio
    async def test_rejects_deleting_foreign_object_key(self, uploads_client: AsyncClient):
        response = await uploads_client.delete(
            "/api/3d/upload/uploads/dresses/other-user/file.jpg",
        )

        assert response.status_code == 403
        assert "only delete your own uploads" in response.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_delete_success_returns_204(self, uploads_client: AsyncClient):
        fake_storage = MagicMock()
        fake_storage.delete_object = AsyncMock()

        with patch("app.modules.uploads.api.storage_service", fake_storage):
            response = await uploads_client.delete(
                "/api/3d/upload/uploads/dresses/user-123/file.jpg",
            )

        assert response.status_code == 204
        fake_storage.delete_object.assert_called_once_with("uploads/dresses/user-123/file.jpg")

    @pytest.mark.asyncio
    async def test_delete_returns_500_when_storage_fails(self, uploads_client: AsyncClient):
        fake_storage = MagicMock()
        fake_storage.delete_object = AsyncMock(side_effect=RuntimeError("delete failed"))

        with patch("app.modules.uploads.api.storage_service", fake_storage):
            response = await uploads_client.delete(
                "/api/3d/upload/uploads/dresses/user-123/file.jpg",
            )

        assert response.status_code == 500
        assert response.json()["detail"] == "Delete failed"
