"""Tests for South Asian garment specialization in VTON pipeline."""

from __future__ import annotations

from types import SimpleNamespace

import torch
from PIL import Image


ALLOWED_TYPES = {
    "sari",
    "salwar_kameez",
    "lehenga",
    "western_dress",
    "anarkali",
    "kurti",
    "unknown",
}


def test_classify_garment_returns_valid_type(tmp_path, monkeypatch) -> None:
    """Classifier should return a type from the supported schema."""
    from app.services import garment_classifier

    # Reset cache to keep test deterministic.
    garment_classifier._classification_cache.clear()

    image_path = tmp_path / "garment.jpg"
    Image.new("RGB", (120, 180), (200, 20, 20)).save(image_path)

    class FakeProcessor:
        def __call__(self, text, images, return_tensors, padding):
            return {"pixel_values": torch.ones((1, 3, 224, 224))}

    class FakeModel:
        def __call__(self, **kwargs):
            # Highest score at index 0 (sari).
            return SimpleNamespace(logits_per_image=torch.tensor([[10.0, 1.0, 1.0, 1.0, 1.0, 1.0, 0.2]]))

    monkeypatch.setattr(
        garment_classifier,
        "_get_clip",
        lambda: (FakeModel(), FakeProcessor()),
    )

    result = garment_classifier.classify_garment(str(image_path))

    assert result["type"] in ALLOWED_TYPES
    assert isinstance(result["is_south_asian"], bool)
    assert isinstance(result["confidence"], float)


def test_south_asian_preprocessing_preserves_size() -> None:
    """Preprocessing should keep output dimensions unchanged."""
    from app.services.south_asian_preprocessing import south_asian_preprocessing

    source = Image.new("RGB", (256, 256), (100, 140, 180))
    output = south_asian_preprocessing(source, "kurti")

    assert output.size == source.size


def test_scene_prefix_for_sari() -> None:
    """Sari prefix should include South Asian context wording."""
    from app.services.south_asian_preprocessing import get_south_asian_scene_prefix

    prefix = get_south_asian_scene_prefix("sari")

    assert "South Asian" in prefix
