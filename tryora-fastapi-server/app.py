"""Hugging Face Space entrypoint for ZeroGPU OOTDiffusion inference.

This file is only used when deploying this repository as a HF Space.
It is not used by the FastAPI application (`app/main.py`).
"""

from __future__ import annotations

import os
import tempfile

import gradio as gr
import spaces
from PIL import Image

from app.services.vton_service import run_ootdiffusion


def _save_temp_image(image: Image.Image, suffix: str) -> str:
    fd, path = tempfile.mkstemp(suffix=suffix)
    os.close(fd)
    image.save(path)
    return path


@spaces.GPU
def run_inference(person_image: Image.Image, garment_image: Image.Image) -> Image.Image:
    person_path = _save_temp_image(person_image.convert("RGB"), ".png")
    garment_path = _save_temp_image(garment_image.convert("RGB"), ".png")

    try:
        return run_ootdiffusion(person_path, garment_path)
    finally:
        for path in (person_path, garment_path):
            try:
                os.unlink(path)
            except OSError:
                pass


demo = gr.Interface(
    fn=run_inference,
    inputs=[
        gr.Image(type="pil", label="Person Image"),
        gr.Image(type="pil", label="Garment Image"),
    ],
    outputs=gr.Image(type="pil", label="Result Image"),
    title="Tryora OOTDiffusion ZeroGPU Endpoint",
    description="Remote OOTDiffusion inference endpoint used by Railway FastAPI services.",
    api_name="predict",
)


if __name__ == "__main__":
    demo.launch()
