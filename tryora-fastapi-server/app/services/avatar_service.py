"""Avatar generation pipeline: multi-view photos → SMPL-X mesh → GLB."""

import logging
import os
import tempfile

import httpx
import trimesh

from app.services.storage_service import StorageService

try:
    import smplx
    import torch
    import numpy as np
except ImportError:  # pragma: no cover
    smplx = None  # type: ignore[assignment]
    torch = None  # type: ignore[assignment]
    np = None  # type: ignore[assignment]

logger = logging.getLogger(__name__)

# A-pose: left upper arm index 16, right upper arm index 17 in body_pose joints
# Shoulder abduction ~30 degrees (π/6 radians) rotated about the local z-axis
_LEFT_SHOULDER_IDX = 16
_RIGHT_SHOULDER_IDX = 17
_SHOULDER_ABDUCTION_RAD = 0.5236  # ~30 degrees


def body_estimation(front_path: str, side_path: str, back_path: str) -> dict:
    """Estimate SMPL-X parameters from multi-view images.

    TODO: Replace stub with real HMR2.0 inference via
    4D-Humans/HMR2 when GPU compute is available.
    """
    logger.info("HMR2.0 estimation running")
    return {
        "betas": [0.0] * 10,
        "global_orient": [0.0] * 3,
        "body_pose": [0.0] * 63,
        "height_estimate": 1.65,
        "weight_estimate": 60.0,
    }


def generate_body_mesh(smplx_params: dict) -> trimesh.Trimesh:
    """Generate a body mesh from SMPL-X parameters in A-pose.

    Uses the smplx library to build the body model, zeroes out body_pose,
    and applies standard A-pose shoulder abduction angles before returning
    the resulting mesh as a trimesh.Trimesh.
    """
    if smplx is None or torch is None:  # pragma: no cover
        raise RuntimeError(
            "smplx and torch must be installed to run generate_body_mesh"
        )

    betas = torch.tensor(
        smplx_params["betas"], dtype=torch.float32
    ).unsqueeze(0)
    global_orient = torch.tensor(
        smplx_params["global_orient"], dtype=torch.float32
    ).unsqueeze(0)

    # A-pose: zero body_pose then apply shoulder abduction
    body_pose = torch.zeros(1, 63, dtype=torch.float32)
    body_pose[0, _LEFT_SHOULDER_IDX * 3 + 2] = _SHOULDER_ABDUCTION_RAD
    body_pose[0, _RIGHT_SHOULDER_IDX * 3 + 2] = -_SHOULDER_ABDUCTION_RAD

    model_path = os.environ.get("SMPLX_MODEL_PATH", "models")
    body_model = smplx.create(
        model_path=model_path,
        model_type="smplx",
        gender="neutral",
        use_face_contour=False,
        num_betas=10,
        num_expression_coeffs=10,
        ext="npz",
    )

    with torch.no_grad():
        output = body_model(
            betas=betas,
            global_orient=global_orient,
            body_pose=body_pose,
        )

    vertices = output.vertices.detach().cpu().numpy().squeeze()
    faces = body_model.faces

    return trimesh.Trimesh(vertices=vertices, faces=faces, process=False)


def export_glb(mesh: trimesh.Trimesh, output_path: str) -> str:
    """Export a trimesh mesh to GLB format at output_path.

    Returns output_path.
    """
    mesh.export(output_path)
    return output_path


def _download_photo(client: httpx.Client, url: str, temp_files: list) -> str:
    """Download a photo URL to a temporary file, tracking it in temp_files."""
    response = client.get(url)
    response.raise_for_status()

    suffix = os.path.splitext(url.split("?")[0])[-1] or ".jpg"
    fd, path = tempfile.mkstemp(suffix=suffix)
    try:
        os.write(fd, response.content)
    finally:
        os.close(fd)

    temp_files.append(path)
    return path


def run_avatar_pipeline(
    job_id: str,
    user_id: str,
    front_url: str,
    side_url: str,
    back_url: str,
) -> str:
    """Orchestrate the full avatar generation pipeline.

    1. Download three photos to temp files.
    2. Estimate SMPL-X parameters (HMR2.0 stub).
    3. Generate the body mesh.
    4. Export to GLB.
    5. Upload GLB to R2 and return the public URL.

    All temporary files are removed in a finally block.
    """
    temp_files: list[str] = []
    try:
        with httpx.Client() as client:
            front_path = _download_photo(client, front_url, temp_files)
            side_path = _download_photo(client, side_url, temp_files)
            back_path = _download_photo(client, back_url, temp_files)

        smplx_params = body_estimation(front_path, side_path, back_path)
        mesh = generate_body_mesh(smplx_params)

        fd, glb_path = tempfile.mkstemp(suffix=".glb")
        os.close(fd)
        temp_files.append(glb_path)
        export_glb(mesh, glb_path)

        storage = StorageService()
        object_key = f"avatars/{user_id}/{job_id}/avatar.glb"
        result_url = storage.upload_file(glb_path, object_key)

        return result_url
    finally:
        for path in temp_files:
            try:
                os.unlink(path)
            except OSError:
                pass
