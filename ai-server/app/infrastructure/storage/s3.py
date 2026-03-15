"""
s3_service.py — AWS S3 Service
--------------------------------
Async wrapper around boto3 for GLB storage, dress image uploads, and GDPR delete.
All blocking boto3 calls are wrapped in asyncio.to_thread.

Bucket structure (tryora-assets):
  avatars/{userId}/base.glb
  avatars/{userId}/measurements.json
  catalog/dresses/{dressId}/variants/{label}.glb
  uploads/dresses/{userId}/{sha256}.{ext}
  results/try-on/{jobId}/dressed.glb
"""
from __future__ import annotations

import asyncio
import logging
from io import BytesIO
from typing import Optional

import boto3
from botocore.exceptions import BotoCoreError, ClientError

from app.config.settings import settings

logger = logging.getLogger("api_security")

_s3_client = None


def _get_s3_client():
    global _s3_client
    if _s3_client is None:
        kwargs: dict = {"region_name": settings.AWS_REGION}
        if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
            kwargs["aws_access_key_id"] = settings.AWS_ACCESS_KEY_ID
            kwargs["aws_secret_access_key"] = settings.AWS_SECRET_ACCESS_KEY
        _s3_client = boto3.client("s3", **kwargs)
    return _s3_client


class S3Service:
    """Async S3 operations for GLB files and dress images."""

    def __init__(self, bucket: str = "") -> None:
        self.bucket = bucket or settings.S3_BUCKET

    # ── Upload ────────────────────────────────────────────────────────────────

    async def upload_bytes(
        self,
        key: str,
        data: bytes,
        content_type: str = "application/octet-stream",
        bucket: str = "",
    ) -> None:
        """Upload raw bytes to S3 under *key*."""
        target_bucket = bucket or self.bucket

        def _upload() -> None:
            _get_s3_client().put_object(
                Bucket=target_bucket,
                Key=key,
                Body=data,
                ContentType=content_type,
            )

        await asyncio.to_thread(_upload)
        logger.info("S3 upload: s3://%s/%s (%d bytes)", target_bucket, key, len(data))

    # ── Download ──────────────────────────────────────────────────────────────

    async def download_bytes(self, key: str, bucket: str = "") -> bytes:
        """Download an S3 object and return its content as bytes."""
        target_bucket = bucket or self.bucket

        def _download() -> bytes:
            response = _get_s3_client().get_object(Bucket=target_bucket, Key=key)
            return response["Body"].read()

        try:
            data: bytes = await asyncio.to_thread(_download)
            logger.info("S3 download: s3://%s/%s (%d bytes)", target_bucket, key, len(data))
            return data
        except ClientError as exc:
            error_code = exc.response["Error"]["Code"]
            if error_code in ("NoSuchKey", "404"):
                raise FileNotFoundError(f"S3 object not found: s3://{target_bucket}/{key}") from exc
            raise

    # ── Presigned URL ─────────────────────────────────────────────────────────

    async def generate_presigned_url(
        self, key: str, ttl: int = 900, bucket: str = ""
    ) -> str:
        """
        Generate a presigned GET URL for *key* with the given TTL (seconds).
        Never exposes a public URL — callers must authenticate before calling this.
        """
        target_bucket = bucket or self.bucket

        def _presign() -> str:
            return _get_s3_client().generate_presigned_url(
                "get_object",
                Params={"Bucket": target_bucket, "Key": key},
                ExpiresIn=ttl,
            )

        url: str = await asyncio.to_thread(_presign)
        return url

    # ── Delete ────────────────────────────────────────────────────────────────

    async def delete_object(self, key: str, bucket: str = "") -> None:
        """Delete a single S3 object."""
        target_bucket = bucket or self.bucket

        def _delete() -> None:
            _get_s3_client().delete_object(Bucket=target_bucket, Key=key)

        await asyncio.to_thread(_delete)
        logger.info("S3 delete: s3://%s/%s", target_bucket, key)

    # ── Purge prefix (GDPR) ───────────────────────────────────────────────────

    async def purge_prefix(self, prefix: str, bucket: str = "") -> int:
        """
        Delete all objects under *prefix* (paginated, in batches of 1000).
        Required for GDPR right-to-erasure.
        Returns total count of deleted objects.
        """
        target_bucket = bucket or self.bucket

        def _purge() -> int:
            client = _get_s3_client()
            paginator = client.get_paginator("list_objects_v2")
            total_deleted = 0
            for page in paginator.paginate(Bucket=target_bucket, Prefix=prefix):
                objects = page.get("Contents", [])
                if not objects:
                    continue
                delete_payload = {"Objects": [{"Key": obj["Key"]} for obj in objects]}
                client.delete_objects(Bucket=target_bucket, Delete=delete_payload)
                total_deleted += len(objects)
            return total_deleted

        count: int = await asyncio.to_thread(_purge)
        logger.info("S3 purge_prefix: s3://%s/%s — %d objects deleted", target_bucket, prefix, count)
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


# Singleton instance
s3_service = S3Service()
