"""
uploads.py — /api/3d/upload/* routes
--------------------------------------
POST   /api/3d/upload/dress-image  — upload a dress reference image (EXIF-stripped, SHA-256 dedup)
DELETE /api/3d/upload/{object_key} — delete a previously uploaded file
"""

from __future__ import annotations

import hashlib
import io
import logging
from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from app.shared.security.jwt import TokenPayload, get_current_user
from app.modules.templates.schemas import UploadDressImageResponse
from app.infrastructure.storage.storage_service import storage_service

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
            fmt = (
                "JPEG"
                if content_type == "image/jpeg"
                else "PNG"
                if content_type == "image/png"
                else "WEBP"
            )
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
)
async def upload_dress_image(
    file: Annotated[UploadFile, File(description="JPEG, PNG, or WebP ≤ 10 MB")],
    current_user: Annotated[TokenPayload, Depends(get_current_user)],
) -> UploadDressImageResponse:

    # 1. Validate MIME type
    if file.content_type not in _ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported file type '{file.content_type}'",
        )

    # 2. Read and validate size
    raw = await file.read()
    if len(raw) > _MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds 10MB limit ({len(raw)} bytes)",
        )

    # 3. Strip EXIF
    clean = _strip_exif(raw, file.content_type)

    # 4. Hash for deduplication
    sha = hashlib.sha256(clean).hexdigest()

    # 5. Build object key (provider-agnostic)
    ext_map = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}
    ext = ext_map[file.content_type]

    object_key = storage_service.key_dress_upload(
        current_user.user_id,
        sha,
        ext,
    )

    # 6. Upload
    try:
        await storage_service.upload_bytes(
            object_key=object_key,
            data=clean,
            content_type=file.content_type,
        )
    except Exception as exc:
        logger.exception("Upload failed for user %s", current_user.user_id)
        raise HTTPException(status_code=500, detail="Upload failed") from exc

    # 7. Presigned URL (optional)
    try:
        presigned_url = await storage_service.generate_presigned_url(
            object_key,
            ttl=900,
        )
    except Exception:
        presigned_url = None

    return UploadDressImageResponse(
        s3Key=object_key,  # keep field name for backward compatibility
        sha256=sha,
        presignedUrl=presigned_url,
        contentType=file.content_type,
        sizeBytes=len(clean),
    )


# ── DELETE /api/3d/upload/{object_key} ----------------------------------------

@router.delete(
    "/3d/upload/{object_key:path}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_upload(
    object_key: str,
    current_user: Annotated[TokenPayload, Depends(get_current_user)],
) -> None:

    # Ownership enforcement
    expected_prefix = f"uploads/dresses/{current_user.user_id}/"

    if not object_key.startswith(expected_prefix):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own uploads.",
        )

    try:
        await storage_service.delete_object(object_key)
    except Exception as exc:
        logger.exception(
            "Delete failed for key %s user %s",
            object_key,
            current_user.user_id,
        )
        raise HTTPException(status_code=500, detail="Delete failed") from exc