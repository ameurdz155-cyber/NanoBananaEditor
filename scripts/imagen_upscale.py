"""Upscale an image with Google Imagen 3.0-002 using an AI Studio API key.

Example:

  $ export GOOGLE_API_KEY="ai.studio-key"
  $ python scripts/imagen_upscale.py \
      --input-image=low_res.png \
      --output-image=upscaled.png \
      --scale=2

You must provide either ``--scale`` (2x or 4x) or ``--target-width`` / ``--target-height``
to request an absolute output size.
"""

from __future__ import annotations

import argparse
import base64
import json
import os
from pathlib import Path
from typing import Any, Dict, Optional

import requests


MODEL_NAME = "imagen-3.0-002"
API_BASE = "https://generativelanguage.googleapis.com/v1beta"
API_KEY_ENV = "AIzaSyAtv_8aqOikkGezku6lHSgZMlJUP4DJGZc"


def _load_image_bytes(path: Path) -> bytes:
    with path.open("rb") as fh:
        return fh.read()


def _build_endpoint() -> str:
    return f"{API_BASE}/models/{MODEL_NAME}:predict"


def _build_payload(
    image_bytes: bytes,
    *,
    scale: Optional[int],
    target_width: Optional[int],
    target_height: Optional[int],
    mime_type: str,
) -> Dict[str, Any]:
    if not any([scale, target_width, target_height]):
        raise ValueError("Provide --scale or --target-width/--target-height")

    parameters: Dict[str, Any] = {
        "outputMimeType": mime_type,
        "superResolution": {},
    }

    if scale is not None:
        if scale not in (2, 4):
            raise ValueError("--scale must be 2 or 4")
        parameters["superResolution"]["scale"] = scale

    if target_width or target_height:
        parameters["superResolution"]["targetSize"] = {}
        if target_width:
            parameters["superResolution"]["targetSize"]["width"] = target_width
        if target_height:
            parameters["superResolution"]["targetSize"]["height"] = target_height

    instance = {
        "image": {"bytesBase64Encoded": base64.b64encode(image_bytes).decode("ascii")},
        "mode": "UPSCALE",
    }

    return {"instances": [instance], "parameters": parameters}


def upscale_image(
    input_path: Path,
    output_path: Path,
    *,
    api_key: str,
    scale: Optional[int],
    target_width: Optional[int],
    target_height: Optional[int],
    mime_type: str = "image/png",
) -> None:
    endpoint = _build_endpoint()
    payload = _build_payload(
        _load_image_bytes(input_path),
        scale=scale,
        target_width=target_width,
        target_height=target_height,
        mime_type=mime_type,
    )

    response = requests.post(
        endpoint,
        params={"key": api_key},
        json=payload,
        timeout=300,
    )
    response.raise_for_status()

    body = response.json()
    try:
        image_b64 = body["predictions"][0]["bytesBase64Encoded"]
    except (KeyError, IndexError) as exc:  # pragma: no cover
        raise RuntimeError(f"Unexpected response: {json.dumps(body, indent=2)}") from exc

    output_path.write_bytes(base64.b64decode(image_b64))


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input-image", type=Path, required=True, help="Path to source image")
    parser.add_argument("--output-image", type=Path, required=True, help="Where to save the upscaled image")
    parser.add_argument(
        "--scale",
        type=int,
        choices=[2, 4],
        help="Super resolution factor (2 or 4). Mutually exclusive with target size flags.",
    )
    parser.add_argument("--target-width", type=int, help="Optional explicit output width in pixels")
    parser.add_argument("--target-height", type=int, help="Optional explicit output height in pixels")
    parser.add_argument(
        "--mime-type",
        default="image/png",
        help="Desired MIME type for the returned image (image/png or image/jpeg).",
    )
    parser.add_argument(
        "--api-key",
        default=None,
        help="Google AI Studio API key. Defaults to the value of $GOOGLE_API_KEY.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    api_key = args.api_key or os.getenv(API_KEY_ENV)
    if not api_key:
        raise SystemExit(
            "Provide an API key via --api-key or set the GOOGLE_API_KEY environment variable."
        )

    upscale_image(
        input_path=args.input_image,
        output_path=args.output_image,
        api_key=api_key,
        scale=args.scale,
        target_width=args.target_width,
        target_height=args.target_height,
        mime_type=args.mime_type,
    )


if __name__ == "__main__":
    main()
