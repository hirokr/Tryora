"""Tests for app/services/avatar_service.py."""

import os
import tempfile as _real_tempfile
from pathlib import Path
from unittest.mock import MagicMock, patch

import numpy as np
import pytest
import trimesh

from app.services.avatar_service import export_glb, generate_body_mesh, run_avatar_pipeline


# ---------------------------------------------------------------------------
# test_generate_body_mesh_returns_trimesh
# ---------------------------------------------------------------------------

def test_generate_body_mesh_returns_trimesh() -> None:
    """generate_body_mesh should return a trimesh.Trimesh built from smplx output."""
    fake_vertices = np.zeros((10475, 3), dtype=np.float32)
    fake_faces = np.zeros((20908, 3), dtype=np.int32)

    # --- smplx mock ---
    mock_smplx = MagicMock()
    mock_body_model = MagicMock()
    mock_output = MagicMock()
    # output.vertices.detach().cpu().numpy().squeeze() → fake_vertices
    (
        mock_output.vertices
        .detach.return_value
        .cpu.return_value
        .numpy.return_value
        .squeeze.return_value
    ) = fake_vertices
    mock_body_model.return_value = mock_output
    mock_body_model.faces = fake_faces
    mock_smplx.create.return_value = mock_body_model

    # --- torch mock ---
    mock_torch = MagicMock()
    # torch.no_grad() must behave as a context manager — MagicMock does so
    # automatically but we need __enter__ to return None so the `with` works.
    mock_torch.no_grad.return_value.__enter__ = MagicMock(return_value=None)
    mock_torch.no_grad.return_value.__exit__ = MagicMock(return_value=False)

    smplx_params = {
        "betas": [0.0] * 10,
        "global_orient": [0.0] * 3,
        "body_pose": [0.0] * 63,
    }

    with (
        patch("app.services.avatar_service.smplx", mock_smplx),
        patch("app.services.avatar_service.torch", mock_torch),
    ):
        result = generate_body_mesh(smplx_params)

    assert isinstance(result, trimesh.Trimesh)


# ---------------------------------------------------------------------------
# test_export_glb_creates_file
# ---------------------------------------------------------------------------

def test_export_glb_creates_file(tmp_path: Path) -> None:
    """export_glb should write a file at the given path with a .glb extension."""
    mesh = trimesh.creation.box()
    output_path = str(tmp_path / "avatar.glb")

    returned_path = export_glb(mesh, output_path)

    assert returned_path == output_path
    assert os.path.exists(output_path)
    assert output_path.endswith(".glb")
    assert os.path.getsize(output_path) > 0


# ---------------------------------------------------------------------------
# test_run_avatar_pipeline_cleans_temp_files
# ---------------------------------------------------------------------------

def test_run_avatar_pipeline_cleans_temp_files() -> None:
    """run_avatar_pipeline must delete every temp file it creates."""
    created_paths: list[str] = []

    def _spy_mkstemp(*args, **kwargs):
        fd, path = _real_tempfile.mkstemp(*args, **kwargs)
        created_paths.append(path)
        return fd, path

    # Fake HTTP response for all three photo downloads
    mock_response = MagicMock()
    mock_response.content = b"fake_image_data"
    mock_response.raise_for_status = MagicMock()

    mock_http_client = MagicMock()
    mock_http_client.get.return_value = mock_response

    mock_httpx = MagicMock()
    mock_httpx.Client.return_value.__enter__ = MagicMock(return_value=mock_http_client)
    mock_httpx.Client.return_value.__exit__ = MagicMock(return_value=False)

    mock_storage = MagicMock()
    mock_storage.upload_file.return_value = "https://cdn.example.com/avatars/u1/j1/avatar.glb"

    mock_tempfile = MagicMock()
    mock_tempfile.mkstemp.side_effect = _spy_mkstemp

    with (
        patch("app.services.avatar_service.httpx", mock_httpx),
        patch("app.services.avatar_service.tempfile", mock_tempfile),
        patch("app.services.avatar_service.generate_body_mesh") as mock_gen,
        patch("app.services.avatar_service.StorageService") as mock_storage_cls,
    ):
        mock_gen.return_value = trimesh.creation.box()
        mock_storage_cls.return_value = mock_storage

        result = run_avatar_pipeline(
            job_id="job-1",
            user_id="user-1",
            front_url="https://example.com/front.jpg",
            side_url="https://example.com/side.jpg",
            back_url="https://example.com/back.jpg",
        )

    assert result == "https://cdn.example.com/avatars/u1/j1/avatar.glb"
    assert len(created_paths) == 4, "expected 3 photo files + 1 GLB file"
    for path in created_paths:
        assert not os.path.exists(path), f"temp file was not cleaned up: {path}"
