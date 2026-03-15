from pathlib import Path

try:
    from botocore.exceptions import ClientError
except Exception:  # pragma: no cover
    ClientError = Exception

from app.core.config import get_settings
from app.core.r2_client import get_r2_client


class StorageService:
    def __init__(self) -> None:
        self.settings = get_settings()
        self.client = get_r2_client()

    def upload_file(self, local_path: str, object_key: str) -> str:
        file_path = Path(local_path)
        if not file_path.exists():
            raise FileNotFoundError(f"File not found: {local_path}")

        self.client.upload_file(
            str(file_path),
            self.settings.r2_bucket_name,
            object_key,
        )
        return f"{self.settings.r2_public_base_url.rstrip('/')}/{object_key}"

    def download_file(self, object_key: str, local_path: str) -> str:
        target = Path(local_path)
        target.parent.mkdir(parents=True, exist_ok=True)
        try:
            self.client.download_file(
                self.settings.r2_bucket_name,
                object_key,
                str(target),
            )
        except ClientError as exc:
            raise RuntimeError(f"Failed to download object '{object_key}'") from exc
        return str(target)
