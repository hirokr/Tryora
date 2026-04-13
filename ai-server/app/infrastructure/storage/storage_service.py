"""
storage_service.py — Unified Storage Service (S3 + R2)
------------------------------------------------------
Single interface for object storage.
Switch provider via config: STORAGE_PROVIDER = "s3" | "r2"
"""

from __future__ import annotations

import asyncio
import logging

import boto3
from botocore.client import Config
from botocore.exceptions import ClientError

from app.config.settings import settings

logger = logging.getLogger("api_security")

_client = None


def _get_client():
    """
    Creates a boto3 client based on selected provider.
    """
    global _client

    if _client is not None:
        return _client

    if settings.STORAGE_PROVIDER == "s3":
        kwargs: dict = {
            "region_name": settings.AWS_REGION,
        }

        if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
            kwargs["aws_access_key_id"] = settings.AWS_ACCESS_KEY_ID
            kwargs["aws_secret_access_key"] = settings.AWS_SECRET_ACCESS_KEY

        _client = boto3.client("s3", **kwargs)

    elif settings.STORAGE_PROVIDER == "r2":
        kwargs: dict = {
            "service_name": "s3",
            "region_name": "auto",
            "endpoint_url": settings.R2_ENDPOINT_URL,
            "aws_access_key_id": settings.R2_ACCESS_KEY_ID,
            "aws_secret_access_key": settings.R2_SECRET_ACCESS_KEY,
            "config": Config(signature_version="s3v4"),
        }

        _client = boto3.client("s3", **kwargs)

    else:
        raise ValueError(f"Invalid STORAGE_PROVIDER: {settings.STORAGE_PROVIDER}")

    return _client


class StorageService:
    """Unified async storage service."""

    def __init__(self, bucket: str = "") -> None:
        if settings.STORAGE_PROVIDER == "s3":
            self.bucket = bucket or settings.S3_BUCKET
        else:
            self.bucket = bucket or settings.R2_BUCKET

    # ── Upload ────────────────────────────────────────────────────────────────

    async def upload_bytes(
        self,
        object_key: str,
        data: bytes,
        content_type: str = "application/octet-stream",
        bucket: str = "",
    ) -> None:
        target_bucket = bucket or self.bucket

        def _upload():
            _get_client().put_object(
                Bucket=target_bucket,
                Key=object_key,
                Body=data,
                ContentType=content_type,
            )

        await asyncio.to_thread(_upload)
        logger.info("[%s] upload: %s/%s (%d bytes)",
                    settings.STORAGE_PROVIDER, target_bucket, object_key, len(data))

    # ── Download ──────────────────────────────────────────────────────────────

    async def download_bytes(self, object_key: str, bucket: str = "") -> bytes:
        target_bucket = bucket or self.bucket

        def _download():
            response = _get_client().get_object(
                Bucket=target_bucket,
                Key=object_key,
            )
            return response["Body"].read()

        try:
            data = await asyncio.to_thread(_download)
            logger.info("[%s] download: %s/%s (%d bytes)",
                        settings.STORAGE_PROVIDER, target_bucket, object_key, len(data))
            return data

        except ClientError as exc:
            error_code = exc.response["Error"]["Code"]

            if error_code in ("NoSuchKey", "404"):
                raise FileNotFoundError(
                    f"{settings.STORAGE_PROVIDER} object not found: {target_bucket}/{object_key}"
                ) from exc

            raise

    # ── Presigned URL ─────────────────────────────────────────────────────────

    async def generate_presigned_url(
        self, object_key: str, ttl: int = 900, bucket: str = ""
    ) -> str:
        target_bucket = bucket or self.bucket

        def _presign():
            return _get_client().generate_presigned_url(
                "get_object",
                Params={"Bucket": target_bucket, "Key": object_key},
                ExpiresIn=ttl,
            )

        return await asyncio.to_thread(_presign)

    # ── Delete ────────────────────────────────────────────────────────────────

    async def delete_object(self, object_key: str, bucket: str = "") -> None:
        target_bucket = bucket or self.bucket

        def _delete():
            _get_client().delete_object(
                Bucket=target_bucket,
                Key=object_key,
            )

        await asyncio.to_thread(_delete)
        logger.info("[%s] delete: %s/%s",
                    settings.STORAGE_PROVIDER, target_bucket, object_key)

    # ── Purge prefix (GDPR) ───────────────────────────────────────────────────

    async def purge_prefix(self, prefix: str, bucket: str = "") -> int:
        target_bucket = bucket or self.bucket

        def _purge():
            client = _get_client()
            paginator = client.get_paginator("list_objects_v2")

            total_deleted = 0

            for page in paginator.paginate(
                Bucket=target_bucket,
                Prefix=prefix,
            ):
                objects = page.get("Contents", [])
                if not objects:
                    continue

                delete_payload = {
                    "Objects": [{"Key": obj["Key"]} for obj in objects]
                }

                client.delete_objects(
                    Bucket=target_bucket,
                    Delete=delete_payload,
                )

                total_deleted += len(objects)

            return total_deleted

        count = await asyncio.to_thread(_purge)

        logger.info("[%s] purge: %s/%s — %d deleted",
                    settings.STORAGE_PROVIDER, target_bucket, prefix, count)

        return count

    # ── Key helpers ───────────────────────────────────────────────────────────

    @staticmethod
    def key_base_avatar(user_id: str) -> str:
        return f"avatars/{user_id}/base.glb"

    @staticmethod
    def key_dress_upload(user_id: str, sha256: str, ext: str = "jpg") -> str:
        return f"uploads/dresses/{user_id}/{sha256}.{ext}"

    @staticmethod
    def key_catalog_variant(dress_id: str, body_label: str) -> str:
        return f"catalog/dresses/{dress_id}/variants/{body_label}.glb"

    @staticmethod
    def key_try_on_result(job_id: str) -> str:
        return f"results/try-on/{job_id}/dressed.glb"

    @staticmethod
    def key_measurements(user_id: str) -> str:
        return f"avatars/{user_id}/measurements.json"


# Singleton
storage_service = StorageService()