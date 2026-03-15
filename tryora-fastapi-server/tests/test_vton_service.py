"""Tests for app/services/vton_service.py

Covers:
  test_composite_vton_with_background        -- pure PIL compositing
  test_render_avatar_to_image_output_exists  -- pyrender path (all heavy deps mocked)
  test_run_vton_pipeline_cleans_temp         -- orchestrator cleans every temp file
"""

from __future__ import annotations

import os
import tempfile
from unittest.mock import MagicMock, patch

import numpy as np
from PIL import Image


# ── helpers ───────────────────────────────────────────────────────────────────


def _solid(width: int, height: int, color: tuple) -> Image.Image:
    """Create a solid-colour RGB PIL image."""
    return Image.new("RGB", (width, height), color)


# ── test 1 ────────────────────────────────────────────────────────────────────


def test_composite_vton_with_background() -> None:
    """Output image must have the same (width, height) as bg_image."""
    from app.services.vton_service import composite_vton_with_background

    vton = _solid(512, 768, (255, 255, 255))   # pure white — should become transparent
    bg = _solid(768, 512, (100, 149, 237))     # cornflower blue background

    result = composite_vton_with_background(vton, bg)

    assert result.size == bg.size
    assert result.mode == "RGB"


# ── test 2 ────────────────────────────────────────────────────────────────────


def test_render_avatar_to_image_output_exists(tmp_path) -> None:
    """render_avatar_to_image must write a PNG at output_path.

    All heavy dependencies (httpx, trimesh, pyrender) are mocked so the test
    runs without GPU or display server.  Real numpy is used so that
    Image.fromarray() can save a valid PNG.
    """
    from app.services.vton_service import render_avatar_to_image

    output_path = str(tmp_path / "render.png")

    # Fake colour array -- shape (H=768, W=512, 3) as OffscreenRenderer would return
    fake_color = np.zeros((768, 512, 3), dtype=np.uint8)

    # Minimal fake GLB bytes
    fake_glb_bytes = b"glTF" + b"\x00" * 12

    # httpx mock
    mock_response = MagicMock()
    mock_response.content = fake_glb_bytes

    # pyrender mocks
    mock_renderer = MagicMock()
    mock_renderer.render.return_value = (fake_color, None)
    mock_scene = MagicMock()

    # trimesh: provide a real class for Scene so isinstance() doesn't raise
    class _FakeScene:
        pass

    mock_mesh = MagicMock()

    with (
        patch("app.services.vton_service.httpx") as mock_httpx,
        patch("app.services.vton_service.trimesh") as mock_trimesh,
        patch("app.services.vton_service.pyrender") as mock_pyrender,
        patch("app.services.vton_service.np", np),
    ):
        mock_httpx.get.return_value = mock_response

        mock_trimesh.Scene = _FakeScene          # isinstance(mesh, _FakeScene) → False
        mock_trimesh.load.return_value = mock_mesh

        mock_pyrender.Scene.return_value = mock_scene
        mock_pyrender.Mesh.from_trimesh.return_value = MagicMock()
        mock_pyrender.OrthographicCamera.return_value = MagicMock()
        mock_pyrender.DirectionalLight.return_value = MagicMock()
        mock_pyrender.OffscreenRenderer.return_value = mock_renderer

        result = render_avatar_to_image(
            "https://example.com/avatar.glb", output_path
        )

    assert result == output_path
    assert os.path.exists(output_path), "PNG file was not created"


# ── test 3 ────────────────────────────────────────────────────────────────────


def test_run_vton_pipeline_cleans_temp() -> None:
    """run_vton_pipeline must remove every temp file it creates.

    All AI calls and R2 upload are mocked.  tempfile.mkstemp is intercepted
    to track every path created; after the call, every tracked path must be
    gone.
    """
    from app.services.vton_service import run_vton_pipeline

    dummy_img = _solid(768, 512, (0, 128, 0))

    tracked_paths: list[str] = []
    real_mkstemp = tempfile.mkstemp

    def _tracking_mkstemp(*args, **kwargs):
        fd, path = real_mkstemp(*args, **kwargs)
        tracked_paths.append(path)
        return fd, path

    with (
        patch("app.services.vton_service.render_avatar_to_image"),
        patch(
            "app.services.vton_service.classify_garment",
            return_value={"type": "unknown", "is_south_asian": False, "confidence": 0.0},
        ),
        patch("app.services.vton_service.run_ootdiffusion", return_value=dummy_img),
        patch("app.services.vton_service.generate_background", return_value=dummy_img),
        patch(
            "app.services.vton_service.composite_vton_with_background",
            return_value=dummy_img,
        ),
        patch("app.services.vton_service.StorageService") as mock_storage_cls,
        patch("app.services.vton_service.httpx") as mock_httpx,
        patch("tempfile.mkstemp", side_effect=_tracking_mkstemp),
    ):
        mock_httpx.get.return_value.content = b"fake-garment-bytes"
        mock_storage_cls.return_value.upload_file.return_value = (
            "https://r2.example.com/vton/user-1/job-1/result.png"
        )

        run_vton_pipeline(
            "job-1",
            "user-1",
            "https://example.com/avatar.glb",
            "https://example.com/dress.jpg",
            "luxury hotel lobby",
        )

    assert len(tracked_paths) > 0, "No temp files were created during the pipeline"
    for path in tracked_paths:
        assert not os.path.exists(path), f"Temp file was not cleaned up: {path!r}"


def test_run_ootdiffusion_uses_hf_space_when_env_set(monkeypatch) -> None:
    """run_ootdiffusion must offload to HF when HF_SPACE_URL is configured."""
    from app.services.vton_service import run_ootdiffusion

    monkeypatch.setenv("HF_SPACE_URL", "https://example-space.hf.space")
    expected = _solid(32, 32, (12, 34, 56))

    with patch(
        "app.services.vton_service.run_ootdiffusion_via_hf_space",
        return_value=expected,
    ) as mock_remote:
        result = run_ootdiffusion("person.png", "garment.png")

    assert result is expected
    mock_remote.assert_called_once_with(
        person_image_path="person.png",
        garment_image_path="garment.png",
        hf_space_url="https://example-space.hf.space",
    )
