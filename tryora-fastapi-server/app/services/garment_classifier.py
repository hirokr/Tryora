"""garment_classifier.py - CLIP-based garment type classifier.

Uses a zero-shot style CLIP scoring approach to classify garment images into
project-specific classes and identify South Asian garments.
"""

from __future__ import annotations

import hashlib
import logging
from threading import Lock
from typing import Any

import torch
from PIL import Image
from transformers import CLIPModel, CLIPProcessor

logger = logging.getLogger(__name__)

_ALLOWED_TYPES = {
    "sari",
    "salwar_kameez",
    "lehenga",
    "western_dress",
    "anarkali",
    "kurti",
    "unknown",
}

_SOUTH_ASIAN_TYPES = {"sari", "salwar_kameez", "lehenga", "anarkali", "kurti"}

# Include dupatta in prompt candidates, then map to salwar_kameez in output schema.
_CLASS_PROMPTS: dict[str, str] = {
    "sari": "a full body photo of a person wearing a sari",
    "salwar_kameez": "a full body photo of a person wearing a salwar kameez",
    "lehenga": "a full body photo of a person wearing a lehenga",
    "western_dress": "a full body photo of a person wearing a western dress",
    "anarkali": "a full body photo of a person wearing an anarkali",
    "kurti": "a full body photo of a person wearing a kurti",
    "dupatta": "a photo of a traditional South Asian dupatta",
}

_MODEL_NAME = "openai/clip-vit-base-patch32"
_UNKNOWN_THRESHOLD = 0.30

_model: CLIPModel | None = None
_processor: CLIPProcessor | None = None
_model_lock = Lock()

# Cache by image hash so the same image is never classified twice.
_classification_cache: dict[str, dict[str, Any]] = {}
_cache_lock = Lock()


def _hash_image(path: str) -> str:
    hasher = hashlib.sha256()
    with open(path, "rb") as file:
        for chunk in iter(lambda: file.read(8192), b""):
            hasher.update(chunk)
    return hasher.hexdigest()


def _get_clip() -> tuple[CLIPModel, CLIPProcessor]:
    global _model, _processor
    if _model is None or _processor is None:
        with _model_lock:
            if _model is None or _processor is None:
                logger.info("Loading CLIP model %s (first call) ...", _MODEL_NAME)
                _processor = CLIPProcessor.from_pretrained(_MODEL_NAME)
                _model = CLIPModel.from_pretrained(_MODEL_NAME)
                _model.eval()
                logger.info("CLIP model loaded")

    # Guard for type checkers after lazy init.
    if _model is None or _processor is None:  # pragma: no cover
        raise RuntimeError("CLIP model failed to initialize")

    return _model, _processor


def classify_garment(image_path: str) -> dict[str, Any]:
    """Classify a garment image using CLIP zero-shot similarity scoring.

    Returns:
        {
            "type": one of [sari, salwar_kameez, lehenga, western_dress,
                     anarkali, kurti, unknown],
            "is_south_asian": bool,
            "confidence": float,
        }
    """
    image_hash = _hash_image(image_path)

    with _cache_lock:
        cached = _classification_cache.get(image_hash)
    if cached is not None:
        return dict(cached)

    fallback = {"type": "unknown", "is_south_asian": False, "confidence": 0.0}

    try:
        model, processor = _get_clip()

        image = Image.open(image_path).convert("RGB")
        labels = list(_CLASS_PROMPTS.keys())
        texts = [_CLASS_PROMPTS[label] for label in labels]

        inputs = processor(text=texts, images=image, return_tensors="pt", padding=True)

        with torch.no_grad():
            outputs = model(**inputs)
            logits_per_image = outputs.logits_per_image
            probs = logits_per_image.softmax(dim=1).squeeze(0)

        top_idx = int(torch.argmax(probs).item())
        top_label = labels[top_idx]
        confidence = float(probs[top_idx].item())

        if top_label == "dupatta":
            mapped_type = "salwar_kameez"
        elif confidence < _UNKNOWN_THRESHOLD:
            mapped_type = "unknown"
        else:
            mapped_type = top_label

        if mapped_type not in _ALLOWED_TYPES:
            mapped_type = "unknown"

        result = {
            "type": mapped_type,
            "is_south_asian": mapped_type in _SOUTH_ASIAN_TYPES,
            "confidence": round(confidence, 4),
        }
    except Exception as exc:
        logger.warning("Garment classification failed for %s: %s", image_path, exc)
        result = fallback

    with _cache_lock:
        _classification_cache[image_hash] = dict(result)

    return result
