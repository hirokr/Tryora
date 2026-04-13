"""
tripo_avatar_provider.py — Tripo API integration for avatar generation.
Wraps the Tripo client with avatar-specific logic.
"""
from __future__ import annotations

import logging
from typing import Optional

logger = logging.getLogger("avatar.providers.tripo")


class TripoAvatarProvider:
    """Wrapper around the Tripo client for avatar generation."""

    def __init__(self):
        """Initialize the Tripo avatar provider."""
        pass

    async def generate_from_multiview(
        self,
        front_url: str,
        side_url: Optional[str],
        back_url: Optional[str],
    ) -> bytes:
        """
        Generate a GLB avatar using multi-view photos.

        Args:
            front_url: Presigned URL to front-facing photo
            side_url: Optional presigned URL to side photo
            back_url: Optional presigned URL to back photo

        Returns:
            GLB binary data

        Raises:
            Exception: If generation fails
        """
        from app.infrastructure.external.tripo_client import tripo_client

        logger.info("Tripo multiview: generating from photos")
        
        # Call Tripo API with the provided URLs
        result = await tripo_client.generate_avatar(
            front_image_url=front_url,
            side_image_url=side_url,
            back_image_url=back_url,
        )
        
        # result should contain the GLB binary
        if not result or not isinstance(result, bytes):
            raise ValueError("Tripo returned invalid GLB data")
        
        return result

    async def generate_from_single(self, front_url: str) -> bytes:
        """
        Generate a GLB avatar using only a front-facing photo.

        Args:
            front_url: Presigned URL to front-facing photo

        Returns:
            GLB binary data

        Raises:
            Exception: If generation fails
        """
        from app.infrastructure.external.tripo_client import tripo_client

        logger.info("Tripo single-image: generating from front photo only")
        
        # Call Tripo API with only the front image
        result = await tripo_client.generate_avatar(
            front_image_url=front_url,
            side_image_url=None,
            back_image_url=None,
        )
        
        if not result or not isinstance(result, bytes):
            raise ValueError("Tripo returned invalid GLB data")
        
        return result


# Global singleton instance
tripo_avatar_provider = TripoAvatarProvider()
