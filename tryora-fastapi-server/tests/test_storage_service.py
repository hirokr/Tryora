from pathlib import Path
from unittest.mock import Mock, patch

import pytest

from app.services.storage_service import StorageService


@patch("app.services.storage_service.get_r2_client")
def test_upload_file_returns_public_url(mock_client_factory: Mock, tmp_path: Path) -> None:
    mock_client = Mock()
    mock_client_factory.return_value = mock_client

    file_path = tmp_path / "test.txt"
    file_path.write_text("hello", encoding="utf-8")

    service = StorageService()
    service.settings.r2_bucket_name = "bucket"
    service.settings.r2_public_base_url = "https://cdn.example.com"

    url = service.upload_file(str(file_path), "folder/test.txt")

    assert url == "https://cdn.example.com/folder/test.txt"
    mock_client.upload_file.assert_called_once()


@patch("app.services.storage_service.get_r2_client")
def test_upload_file_raises_when_missing(mock_client_factory: Mock) -> None:
    mock_client_factory.return_value = Mock()
    service = StorageService()

    with pytest.raises(FileNotFoundError):
        service.upload_file("/tmp/not-found.txt", "x")
