"""
uploads.py — /api/3d/upload/* routes
--------------------------------------
POST   /api/3d/upload/dress-image  — upload a dress reference image (EXIF-stripped, SHA-256 dedup)
DELETE /api/3d/upload/{s3_key}     — delete a previously uploaded file
"""
from __future__ import annotations

import hashlib
import io
import logging
from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from app.middleware.auth import TokenPayload, get_current_user
from app.models.template import UploadDressImageResponse
from app.services.s3_service import s3_service

logger = logging.getLogger("api.uploads")

router = APIRouter(tags=["3D Uploads"])

_MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
_ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}


def _strip_exif(image_bytes: bytes, content_type: str) -> bytes:
    """Return image bytes with EXIF metadata removed using Pillow."""
    try:
        from PIL import Image

        with Image.open(io.BytesIO(image_bytes)) as img:
            out = io.BytesIO()
            # Convert to base format — strips all metadata
            fmt = "JPEG" if content_type == "image/jpeg" else "PNG" if content_type == "image/png" else "WEBP"
            # Remove EXIF by re-saving without info dict
            img.save(out, format=fmt)
            return out.getvalue()
    except Exception as exc:
        logger.warning("EXIF strip failed (%s); returning original bytes", exc)
        return image_bytes


# ── POST /api/3d/upload/dress-image -------------------------------------------

@router.post(
    "/3d/upload/dress-image",
    response_model=UploadDressImageResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a garment reference image (EXIF-stripped, SHA-256 dedup)",
)
async def upload_dress_image(
    file: Annotated[UploadFile, File(description="JPEG, PNG, or WebP ≤ 10 MB")],
    current_user: Annotated[TokenPayload, Depends(get_current_user)],
) -> UploadDressImageResponse:
    # Validate MIME type
    if file.content_type not in _ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported file type '{file.content_type}'. Allowed: jpeg, png, webp.",
        )

    # Read and size-check
    raw = await file.read()
    if len(raw) > _MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds the 10 MB limit (received {len(raw)} bytes).",
        )

    # Strip EXIF metadata
    clean = _strip_exif(raw, file.content_type)

    # SHA-256 fingerprint for dedup
    sha = hashlib.sha256(clean).hexdigest()

    # Build deterministic S3 key: {userId}/dress-uploads/{sha}.{ext}
    ext_map = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}
    ext = ext_map[file.content_type]
    s3_key = s3_service.key_dress_upload(current_user.user_id, sha, ext)

    try:
        await s3_service.upload_bytes(
            data=clean,
            object_key=s3_key,
            content_type=file.content_type,
        )
    except Exception as exc:
        logger.exception("S3 upload failed for user %s", current_user.user_id)
        raise HTTPException(status_code=500, detail="Upload failed") from exc

    # Generate a 15-minute presigned URL so the client can preview immediately
    try:
        presigned_url = await s3_service.generate_presigned_url(s3_key, ttl=900)
    except Exception:
        presigned_url = None  # Non-fatal — client can re-request later

    return UploadDressImageResponse(
        s3Key=s3_key,
        sha256=sha,
        presignedUrl=presigned_url,
        contentType=file.content_type,
        sizeBytes=len(clean),
    )


# ── DELETE /api/3d/upload/{s3_key} --------------------------------------------

@router.delete(
    "/3d/upload/{s3_key:path}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a previously uploaded dress image",
)
async def delete_upload(
    s3_key: str,
    current_user: Annotated[TokenPayload, Depends(get_current_user)],
) -> None:
    # Enforce ownership — key must start with the caller's userId prefix
    expected_prefix = f"{current_user.user_id}/"
    if not s3_key.startswith(expected_prefix):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own uploads.",
        )

    try:
        await s3_service.delete_object(s3_key)
    except Exception as exc:
        logger.exception("S3 delete failed for key %s user %s", s3_key, current_user.user_id)
        raise HTTPException(status_code=500, detail="Delete failed") from exc
