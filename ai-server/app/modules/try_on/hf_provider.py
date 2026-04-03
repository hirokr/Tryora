"""
hf_provider.py — HuggingFace Spaces (ZeroGPU) provider
-------------------------------------------------------
Calls a PIFuHD or similar Space via gradio_client.
Free tier with ZeroGPU — no API key needed.

Install: pip install gradio_client
"""
from __future__ import annotations

import asyncio
import logging
import tempfile
from pathlib import Path
from typing import Optional

logger = logging.getLogger("worker.hf_provider")

# Public Space that runs PIFuHD — swap to your own if you deploy one
_DEFAULT_SPACE = "akhaliq/PIFuHD"
_TIMEOUT_S = 120


class HFSpaceUnavailableError(Exception):
    """Raised when the Space is rate-limited, busy, or unreachable."""


class HFProvider:
    """
    Wraps a HuggingFace Gradio Space that accepts an image and returns
    a 3D mesh file (.obj or .glb).

    All network calls are run in a thread executor so the async caller
    is never blocked.
    """

    def __init__(self, space_id: str = _DEFAULT_SPACE) -> None:
        self.space_id = space_id

    async def image_to_glb(self, image_bytes: bytes, image_ext: str = "jpg") -> bytes:
        """
        Submit an image to the HF Space and return GLB bytes.

        Parameters
        ----------
        image_bytes : bytes
            Raw image data (JPEG or PNG).
        image_ext : str
            File extension without dot ("jpg" or "png").

        Returns
        -------
        bytes
            GLB binary.

        Raises
        ------
        HFSpaceUnavailableError
            If the space is busy, rate-limited, or the call times out.
        """
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None, self._blocking_call, image_bytes, image_ext
        )

    def _blocking_call(self, image_bytes: bytes, image_ext: str) -> bytes:
        try:
            from gradio_client import Client, handle_file
        except ImportError:
            raise HFSpaceUnavailableError(
                "gradio_client not installed — run: pip install gradio_client"
            )

        import trimesh

        with tempfile.TemporaryDirectory() as tmp:
            img_path = Path(tmp) / f"input.{image_ext}"
            img_path.write_bytes(image_bytes)

            try:
                client = Client(self.space_id)
                result = client.predict(
                    handle_file(str(img_path)),
                    api_name="/predict",
                )
            except Exception as exc:
                # Covers ConnectionError, httpx errors, gradio errors
                raise HFSpaceUnavailableError(
                    f"HF Space {self.space_id!r} call failed: {exc}"
                ) from exc

            # result is typically a filepath string to the output mesh
            output_path = Path(result) if isinstance(result, str) else None
            if not output_path or not output_path.exists():
                raise HFSpaceUnavailableError("HF Space returned no output file")

            mesh = trimesh.load(str(output_path))
            import io
            buf = io.BytesIO()
            mesh.export(buf, file_type="glb")
            return buf.getvalue()


# Singleton
hf_provider = HFProvider()
