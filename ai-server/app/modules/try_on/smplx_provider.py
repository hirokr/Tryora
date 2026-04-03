"""
smplx_provider.py — Local SMPL-X avatar generation (CPU, free)
---------------------------------------------------------------
Generates a body mesh from normalized tHeight + tFullness values
already stored in UserProfile. No photo, no API call, no cost.

Requires:
  pip install smplx trimesh torch

Model weights (free, requires registration):
  https://smpl-x.is.tue.mpg.de → download SMPLX_NEUTRAL.npz
  Place at: ./models/smplx/SMPLX_NEUTRAL.npz
  Or set env var: SMPLX_MODEL_PATH

Output: GLB bytes, ready to upload to S3 or serve via the template system.
"""
from __future__ import annotations

import asyncio
import io
import logging
import os
from pathlib import Path
from typing import Optional

logger = logging.getLogger("worker.smplx_provider")

# Default model path — override with env var
_MODEL_PATH = os.getenv("SMPLX_MODEL_PATH", "./models/smplx")

# Map tHeight [0,1] to rough height in metres for joint scaling
_HEIGHT_MIN_M = 1.50
_HEIGHT_MAX_M = 1.90

# SMPL-X beta index semantics (approximate — vary slightly between models)
# beta[0]: body size/height (positive = taller)
# beta[1]: body weight/fullness (positive = heavier)
_BETA_SCALE = 3.0  # multiply normalized delta by this for visible effect


class SMPLXUnavailableError(Exception):
    """Raised when weights are missing or torch/smplx are not installed."""


class SMPLXProvider:
    """
    Generates a neutral-gender SMPL-X mesh from body measurement scalars
    and exports it as a GLB binary.

    This is the cheapest, fastest, most privacy-safe option: it runs
    entirely locally, needs no photo, and costs nothing per call.

    Best used when the user has body measurements in their profile
    (tHeight and tFullness are non-null) and you want a body that
    actually matches their proportions.
    """

    def __init__(self, model_path: str = _MODEL_PATH) -> None:
        self.model_path = Path(model_path)
        self._model = None  # lazy load

    def is_available(self) -> bool:
        """Return True if weights and required libraries are present."""
        try:
            import smplx  # noqa: F401
            import torch   # noqa: F401
            import trimesh # noqa: F401
        except ImportError:
            return False
        # Check for at least one weight file
        return any(self.model_path.glob("*.npz")) or any(self.model_path.glob("*.pkl"))

    async def generate_glb(
        self,
        t_height: float,
        t_fullness: float,
        gender: str = "neutral",
    ) -> bytes:
        """
        Async wrapper — runs blocking torch/smplx code in a thread executor.

        Parameters
        ----------
        t_height : float
            Normalized height [0, 1] from UserProfile.tHeight.
        t_fullness : float
            Normalized fullness [0, 1] from UserProfile.tFullness.
        gender : str
            "neutral" | "male" | "female"

        Returns
        -------
        bytes
            GLB binary.

        Raises
        ------
        SMPLXUnavailableError
            If libraries or weights are missing.
        """
        if not self.is_available():
            raise SMPLXUnavailableError(
                f"SMPL-X unavailable. Check model weights at {self.model_path} "
                "and run: pip install smplx torch trimesh"
            )

        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None, self._blocking_generate, t_height, t_fullness, gender
        )

    def _blocking_generate(
        self,
        t_height: float,
        t_fullness: float,
        gender: str,
    ) -> bytes:
        import smplx
        import torch
        import trimesh
        import numpy as np

        # Lazy-load the model (cached after first call — ~200MB in memory)
        if self._model is None:
            logger.info("SMPLXProvider: loading model from %s", self.model_path)
            self._model = smplx.create(
                str(self.model_path),
                model_type="smplx",
                gender=gender,
                use_face_contour=False,
                num_betas=10,
                num_expression_coeffs=10,
                use_pca=False,
            )
            logger.info("SMPLXProvider: model loaded")

        # Map [0,1] → symmetric betas around 0
        # t_height=0.5 → beta=0 (average), 1.0 → +1.5, 0.0 → -1.5
        betas = torch.zeros(1, 10)
        betas[0, 0] = (t_height   - 0.5) * _BETA_SCALE   # height
        betas[0, 1] = (t_fullness - 0.5) * _BETA_SCALE   # fullness

        with torch.no_grad():
            output = self._model(
                betas=betas,
                expression=torch.zeros(1, 10),
                return_verts=True,
            )

        vertices = output.vertices.detach().cpu().numpy()[0]  # (N, 3)
        faces    = self._model.faces                           # (F, 3)

        # Scale to target height (SMPL-X default ~1.7m)
        target_height = _HEIGHT_MIN_M + t_height * (_HEIGHT_MAX_M - _HEIGHT_MIN_M)
        current_height = vertices[:, 1].max() - vertices[:, 1].min()
        scale = target_height / current_height if current_height > 0 else 1.0
        vertices = vertices * scale

        mesh = trimesh.Trimesh(vertices=vertices, faces=faces, process=False)

        buf = io.BytesIO()
        mesh.export(buf, file_type="glb")
        glb_bytes = buf.getvalue()

        logger.info(
            "SMPLXProvider: generated GLB (%d bytes) tH=%.2f tF=%.2f",
            len(glb_bytes), t_height, t_fullness,
        )
        return glb_bytes


# Singleton — model stays in memory after first call
smplx_provider = SMPLXProvider()
