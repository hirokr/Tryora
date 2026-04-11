"""
smplx_provider.py — Avatar SMPL-X provider shim
------------------------------------------------
Re-exports the SMPLXProvider singleton from the try_on module and exposes
a generate_smplx_avatar() function that the avatar worker expects.
"""
from __future__ import annotations

from app.modules.try_on.smplx_provider import SMPLXProvider, SMPLXUnavailableError

# Re-export so callers can catch the exception without knowing the source module
__all__ = ["smplx_provider", "generate_smplx_avatar", "SMPLXUnavailableError"]

# Singleton (shares the loaded model with the try_on pipeline)
smplx_provider = SMPLXProvider()


async def generate_smplx_avatar(
    t_height: float,
    t_fullness: float,
    gender: str = "neutral",
) -> bytes:
    """
    Generate a GLB avatar using SMPL-X from body measurements.

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
        If SMPL-X libraries or model weights are missing.
    """
    return await smplx_provider.generate_glb(t_height, t_fullness, gender)