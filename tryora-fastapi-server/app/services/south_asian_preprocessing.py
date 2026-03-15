"""south_asian_preprocessing.py - Garment-aware preprocessing utilities."""

from __future__ import annotations

from PIL import Image, ImageEnhance


def _pad_to_aspect_ratio(image: Image.Image, target_width: int, target_height: int) -> Image.Image:
    """Pad image to target aspect ratio without cropping."""
    source_w, source_h = image.size
    target_ratio = target_width / target_height
    source_ratio = source_w / source_h if source_h else target_ratio

    if abs(source_ratio - target_ratio) < 1e-6:
        return image.copy()

    if source_ratio > target_ratio:
        new_w = source_w
        new_h = int(round(source_w / target_ratio))
    else:
        new_h = source_h
        new_w = int(round(source_h * target_ratio))

    canvas = Image.new("RGB", (new_w, new_h), (255, 255, 255))
    offset_x = (new_w - source_w) // 2
    offset_y = (new_h - source_h) // 2
    canvas.paste(image, (offset_x, offset_y))
    return canvas


def _split_salwar_regions(image: Image.Image) -> Image.Image:
    """Apply lightweight region-aware enhancement for kurta/dupatta areas."""
    width, height = image.size
    split_y = int(height * 0.35)

    dupatta = image.crop((0, 0, width, split_y))
    kurta = image.crop((0, split_y, width, height))

    dupatta = ImageEnhance.Sharpness(dupatta).enhance(1.2)
    kurta = ImageEnhance.Sharpness(kurta).enhance(1.1)

    combined = Image.new("RGB", (width, height))
    combined.paste(dupatta, (0, 0))
    combined.paste(kurta, (0, split_y))
    return combined


def south_asian_preprocessing(
    garment_image: Image.Image,
    garment_type: str,
    confidence: float = 0.0,
) -> Image.Image:
    """Preprocess South Asian garments before VTON.

    For sari: pad image to 2:3 ratio (width:height) to reflect drape length.
    For salwar_kameez: split kurta/dupatta regions when confidence > 0.8.
    For all types: increase sharpness by 30%.
    """
    original_size = garment_image.size
    working = garment_image.convert("RGB")

    if garment_type == "sari":
        working = _pad_to_aspect_ratio(working, target_width=2, target_height=3)

    if garment_type == "salwar_kameez" and confidence > 0.8:
        working = _split_salwar_regions(working)

    working = ImageEnhance.Sharpness(working).enhance(1.3)

    if working.size != original_size:
        working = working.resize(original_size, Image.Resampling.LANCZOS)

    return working


def get_south_asian_scene_prefix(garment_type: str) -> str:
    """Return culturally relevant scene prompt prefix for garment types."""
    prefixes = {
        "sari": "elegant South Asian celebration, soft golden hour lighting",
        "salwar_kameez": "casual South Asian street, warm afternoon light",
        "lehenga": "grand Indian wedding ceremony, ornate backdrop",
    }
    return prefixes.get(garment_type, "")
