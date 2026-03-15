"""vton_service.py — TRY_ON_SCENE pipeline

Uses OOTDiffusion (Apache 2.0) for garment try-on inference.

License note
-----------
OOTDiffusion is licensed under Apache 2.0 and is the ONLY try-on model used
here.  IDM-VTON, CatVTON, and StableVITON are **not** used — all three are
CC BY-NC-SA 4.0 (non-commercial only).
"""

from __future__ import annotations

import logging
import os
import tempfile

import httpx
from PIL import Image

from app.services.garment_classifier import classify_garment
from app.services.south_asian_preprocessing import (
    get_south_asian_scene_prefix,
    south_asian_preprocessing,
)

try:
    import pyrender
    import trimesh
    import numpy as np
except ImportError:  # pragma: no cover
    pyrender = None  # type: ignore[assignment]
    trimesh = None  # type: ignore[assignment]
    np = None  # type: ignore[assignment]

try:
    import torch
    from diffusers import StableDiffusionPipeline

    try:
        from diffusers import OotdPipeline
    except ImportError:  # pragma: no cover
        OotdPipeline = None  # type: ignore[assignment]
except ImportError:  # pragma: no cover
    torch = None  # type: ignore[assignment]
    OotdPipeline = None  # type: ignore[assignment]
    StableDiffusionPipeline = None  # type: ignore[assignment]

try:
    from app.services.storage_service import StorageService
except Exception:  # pragma: no cover
    StorageService = None  # type: ignore[assignment,misc]

logger = logging.getLogger(__name__)

# ── Lazy-loaded model pipelines ───────────────────────────────────────────────
_ootd_pipeline = None
_sd_pipeline = None


# ── Key helpers ───────────────────────────────────────────────────────────────


def generate_vton_key(job_id: str, user_id: str) -> str:
    """Return the R2 object key for a VTON result image."""
    return f"vton/{user_id}/{job_id}/result.png"


# ── Step 1 ────────────────────────────────────────────────────────────────────


def render_avatar_to_image(glb_url: str, output_path: str) -> str:
    """Download a GLB and render a front-facing view to a 512x768 PNG.

    Camera:  orthographic, positioned 2 m in front of the avatar along +Z.
    Output:  512 x 768 PNG saved to output_path.

    TODO: Add pose selection -- currently renders only A-pose front view.

    Args:
        glb_url:     HTTP(S) URL of the source GLB file.
        output_path: Destination path for the rendered PNG.

    Returns:
        output_path (echoed back to the caller).
    """
    if pyrender is None or trimesh is None or np is None:
        raise RuntimeError(
            "pyrender, trimesh, and numpy must be installed for render_avatar_to_image"
        )

    temp_glb: str | None = None
    try:
        # Download the GLB to a temp file
        response = httpx.get(glb_url, follow_redirects=True, timeout=60)
        response.raise_for_status()

        fd, temp_glb = tempfile.mkstemp(suffix=".glb")
        try:
            os.write(fd, response.content)
        finally:
            os.close(fd)

        # Load mesh -- trimesh.load returns a Scene for multi-mesh GLBs
        mesh = trimesh.load(temp_glb, force="mesh")

        # Flatten a Scene to a single Trimesh
        if isinstance(mesh, trimesh.Scene):
            mesh = trimesh.util.concatenate(list(mesh.geometry.values()))

        # Build pyrender scene
        scene = pyrender.Scene(ambient_light=np.array([0.3, 0.3, 0.3, 1.0]))
        scene.add(pyrender.Mesh.from_trimesh(mesh))

        # Orthographic camera 2 m in front of the avatar
        camera = pyrender.OrthographicCamera(xmag=1.0, ymag=1.5)
        camera_pose = np.eye(4)
        camera_pose[2, 3] = 2.0  # 2 m along +Z
        scene.add(camera, pose=camera_pose)

        # Directional key light
        light = pyrender.DirectionalLight(color=np.ones(3), intensity=3.0)
        scene.add(light, pose=camera_pose)

        # Offscreen render -> (H=768, W=512, 3) uint8 colour array
        renderer = pyrender.OffscreenRenderer(512, 768)
        try:
            color, _ = renderer.render(scene) #type: ignore[assignment]
        finally:
            renderer.delete()

        Image.fromarray(color).save(output_path, format="PNG")
        return output_path

    finally:
        if temp_glb is not None:
            try:
                os.unlink(temp_glb)
            except OSError:
                pass


# ── Step 2 ────────────────────────────────────────────────────────────────────


def run_ootdiffusion(
    person_image_path: str, garment_image_path: str
) -> Image.Image:
    """Run OOTDiffusion inference and return the composited PIL Image.

    Pipeline is lazy-loaded on first call (model loading ~30 s).
    On GPU out-of-memory error the call is retried with num_inference_steps=10.

    Model: levihsu/OOTDiffusion -- Apache 2.0 licence.
    """
    global _ootd_pipeline

    if OotdPipeline is None or torch is None:
        raise RuntimeError(
            "diffusers (with OotdPipeline) and torch are required for run_ootdiffusion"
        )

    if _ootd_pipeline is None:
        logger.info("Loading OOTDiffusion pipeline (first call, ~30 s) ...")
        _ootd_pipeline = OotdPipeline.from_pretrained(
            "levihsu/OOTDiffusion",
            torch_dtype=torch.float16,
        )
        if torch.cuda.is_available():
            _ootd_pipeline = _ootd_pipeline.to("cuda")
        logger.info("OOTDiffusion pipeline ready.")

    person_image = Image.open(person_image_path).convert("RGB")
    garment_image = Image.open(garment_image_path).convert("RGB")

    def _infer(steps: int) -> Image.Image:
        result = _ootd_pipeline(
            image=person_image,
            condition_image=garment_image,
            num_inference_steps=steps,
            guidance_scale=2.0,
            num_images_per_prompt=1,
        )
        return result.images[0]

    try:
        return _infer(20)
    except RuntimeError as exc:
        if "out of memory" in str(exc).lower():
            logger.warning("GPU OOM during OOTD inference -- retrying with steps=10")
            return _infer(10)
        raise


# ── Step 3 ────────────────────────────────────────────────────────────────────


def generate_background(
    scene_prompt: str, size: tuple[int, int] = (768, 512)
) -> Image.Image:
    """Generate a fashion-photography background via Stable Diffusion.

    Pipeline (runwayml/stable-diffusion-v1-5) is lazy-loaded on first call.

    Args:
        scene_prompt: Natural-language description of the desired scene.
        size:         (width, height) of the output image.

    Returns:
        PIL Image of the generated background.
    """
    global _sd_pipeline

    if StableDiffusionPipeline is None or torch is None:
        raise RuntimeError(
            "diffusers and torch are required for generate_background"
        )

    if _sd_pipeline is None:
        logger.info("Loading StableDiffusion v1-5 pipeline (first call) ...")
        _sd_pipeline = StableDiffusionPipeline.from_pretrained(
            "runwayml/stable-diffusion-v1-5",
            torch_dtype=torch.float16,
        )
        if torch.cuda.is_available():
            _sd_pipeline = _sd_pipeline.to("cuda")
        logger.info("StableDiffusion pipeline ready.")

    width, height = size
    prompt = (
        f"fashion photography background, {scene_prompt}, professional lighting, "
        "8k, photorealistic, no people"
    )
    result = _sd_pipeline(prompt=prompt, width=width, height=height)
    return result.images[0]


# ── Step 4 ────────────────────────────────────────────────────────────────────


def composite_vton_with_background(
    vton_image: Image.Image, bg_image: Image.Image
) -> Image.Image:
    """Remove the white background from vton_image and paste it over bg_image.

    White-background removal uses a per-pixel luminance threshold of 240:
    any pixel where R, G, and B are all >= 240 is made fully transparent.
    The keyed VTON image is then composited centred over bg_image.

    Args:
        vton_image: Try-on result with a white background.
        bg_image:   Scene background image.

    Returns:
        Composited RGB PIL Image with the same dimensions as bg_image.
    """
    bg_w, bg_h = bg_image.size

    # Remove white background via alpha channel
    vton_rgba = vton_image.convert("RGBA")
    pixels = list(vton_rgba.getdata())
    keyed = [
        (r, g, b, 0) if (r >= 240 and g >= 240 and b >= 240) else (r, g, b, a)
        for r, g, b, a in pixels
    ]
    vton_rgba.putdata(keyed)

    # Centre the VTON layer on the background
    vton_w, vton_h = vton_rgba.size
    offset_x = (bg_w - vton_w) // 2
    offset_y = (bg_h - vton_h) // 2

    bg_rgba = bg_image.convert("RGBA")
    bg_rgba.paste(vton_rgba, (offset_x, offset_y), mask=vton_rgba)

    return bg_rgba.convert("RGB")


# ── Step 5 (orchestrator) ─────────────────────────────────────────────────────


def run_vton_pipeline(
    job_id: str,
    user_id: str,
    avatar_glb_url: str,
    dress_image_url: str,
    scene_prompt: str,
) -> str:
    """Orchestrate the full TRY_ON_SCENE pipeline and return the R2 URL.

    Steps
    -----
    1. Render the avatar GLB to a 512x768 front-view PNG.
    2. Download the garment image.
    3. Run OOTDiffusion try-on inference.
    4. Generate a scene background with Stable Diffusion.
    5. Composite the try-on result over the background.
    6. Upload the composite PNG to R2 and return the public URL.

    All temporary files are removed in a finally block regardless of
    success or failure.

    Returns:
        Public R2 URL of the final composite image.
    """
    if StorageService is None:
        raise RuntimeError(
            "StorageService is not available -- ensure boto3/botocore are installed"
        )

    temp_files: list[str] = []
    try:
        # ── 1. Render avatar ────────────────────────────────────────────────
        fd, avatar_render_path = tempfile.mkstemp(suffix="_avatar_render.png")
        os.close(fd)
        temp_files.append(avatar_render_path)
        render_avatar_to_image(avatar_glb_url, avatar_render_path)
        logger.info("[%s] Avatar rendered -> %s", job_id, avatar_render_path)

        # ── 2. Download garment image ────────────────────────────────────────
        fd, garment_path = tempfile.mkstemp(suffix="_garment.jpg")
        os.close(fd)
        temp_files.append(garment_path)
        garment_resp = httpx.get(dress_image_url, follow_redirects=True, timeout=60)
        garment_resp.raise_for_status()
        with open(garment_path, "wb") as fh:
            fh.write(garment_resp.content)
        logger.info("[%s] Garment downloaded -> %s", job_id, garment_path)

        # ── 2.1 Classify garment and apply South Asian preprocessing ───────
        classification = classify_garment(garment_path)
        logger.info("[%s] Garment classification: %s", job_id, classification)

        garment_type = str(classification.get("type", "unknown"))
        confidence = float(classification.get("confidence", 0.0))
        is_south_asian = bool(classification.get("is_south_asian", False))

        processed_scene_prompt = scene_prompt
        if is_south_asian:
            garment_image = Image.open(garment_path).convert("RGB")
            preprocessed = south_asian_preprocessing(
                garment_image=garment_image,
                garment_type=garment_type,
                confidence=confidence,
            )
            preprocessed.save(garment_path)
            logger.info(
                "[%s] South Asian preprocessing applied (type=%s, confidence=%.4f)",
                job_id,
                garment_type,
                confidence,
            )

            scene_prefix = get_south_asian_scene_prefix(garment_type)
            if scene_prefix:
                processed_scene_prompt = f"{scene_prefix}, {scene_prompt}"

        # ── 3. OOTDiffusion try-on ───────────────────────────────────────────
        vton_image = run_ootdiffusion(avatar_render_path, garment_path)
        logger.info("[%s] OOTDiffusion inference complete", job_id)

        # ── 4. Generate background ───────────────────────────────────────────
        bg_image = generate_background(processed_scene_prompt)
        logger.info("[%s] Background generated", job_id)

        # ── 5. Composite ─────────────────────────────────────────────────────
        result_image = composite_vton_with_background(vton_image, bg_image)
        logger.info("[%s] Composite image assembled", job_id)

        # ── 6. Save and upload to R2 ─────────────────────────────────────────
        fd, result_path = tempfile.mkstemp(suffix="_vton_result.png")
        os.close(fd)
        temp_files.append(result_path)
        result_image.save(result_path, format="PNG")

        storage = StorageService()
        key = generate_vton_key(job_id, user_id)
        r2_url = storage.upload_file(result_path, key)
        logger.info("[%s] Result uploaded -> %s", job_id, r2_url)

        return r2_url

    finally:
        for path in temp_files:
            try:
                os.unlink(path)
            except OSError:
                pass
