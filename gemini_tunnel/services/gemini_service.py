"""Gemini AI service for image generation and editing."""

import logging
from typing import Any, Dict, List, Optional
from fastapi import HTTPException
import google.generativeai as genai

from config import API_KEY, GEMINI_FLASH_MODEL
from models import ImagePayload
from utils import normalize_base64, serialize_inline_image, summarize_candidate, extract_candidate_text, summarize_prompt_feedback

logger = logging.getLogger(__name__)
if not logger.handlers:
    logging.basicConfig(level=logging.INFO)

# Configure the Gemini client
genai.configure(api_key=API_KEY)


def build_generation_parts(prompt_text: str, reference_images: Optional[List[str]] = None) -> List[Dict[str, Any]]:
    """Build parts for Gemini content generation."""
    parts: List[Dict[str, Any]] = [
        {"text": "You are an image generator. Reply with image data only."},
        {"text": prompt_text},
    ]

    for image_str in reference_images or []:
        try:
            raw_bytes = normalize_base64(image_str)
        except Exception as exc:
            raise HTTPException(status_code=400, detail=f"Invalid reference image: {exc}") from exc

        parts.append({
            "inline_data": {
                "mime_type": "image/png",
                "data": raw_bytes,
            }
        })

    return parts


def build_generation_args(
    *,
    temperature: Optional[float],
    seed: Optional[int],
) -> Dict[str, Any]:
    """Build generation configuration arguments."""
    generation_config: Dict[str, Any] = {}
    if temperature is not None:
        generation_config["temperature"] = temperature
    if seed is not None:
        generation_config["seed"] = seed

    args: Dict[str, Any] = {}
    if generation_config:
        args["generation_config"] = generation_config

    return args


def generate_images(
    prompt: str,
    negative_prompt: Optional[str] = None,
    reference_images: Optional[List[str]] = None,
    temperature: Optional[float] = None,
    seed: Optional[int] = None,
    aspect_ratio: Optional[str] = None,
    width: Optional[int] = None,
    height: Optional[int] = None,
    num_images: int = 1,
    model: Optional[str] = None
) -> tuple[str, List[ImagePayload]]:
    """Generate images using Gemini."""
    model_name = (model or GEMINI_FLASH_MODEL).strip() or GEMINI_FLASH_MODEL
    model_instance = genai.GenerativeModel(model_name=model_name)

    prompt_text = prompt

    dimension_hints: list[str] = []
    if aspect_ratio:
        dimension_hints.append(f"Desired aspect ratio: {aspect_ratio}")
    if width and height:
        dimension_hints.append(f"Preferred output resolution: {width}x{height} pixels")
    if dimension_hints:
        prompt_text = "\n".join([prompt_text, *dimension_hints])

    if negative_prompt:
        prompt_text = f"{prompt_text}\nDo not include: {negative_prompt}"

    parts = build_generation_parts(prompt_text, reference_images)
    args = build_generation_args(temperature=temperature, seed=seed)

    images: List[ImagePayload] = []
    attempts = max(1, num_images)

    for _ in range(attempts):
        try:
            result = model_instance.generate_content([{"role": "user", "parts": parts}], **args)
        except Exception as exc:
            raise HTTPException(status_code=502, detail=f"Gemini request failed: {exc}") from exc

        for candidate in getattr(result, "candidates", []) or []:
            content = getattr(candidate, "content", None)
            if not content:
                continue
            for part in getattr(content, "parts", []) or []:
                inline = getattr(part, "inline_data", None)
                if inline and getattr(inline, "data", None):
                    raw_data = inline.data if isinstance(inline.data, bytes) else bytes(inline.data)
                    images.append(serialize_inline_image(raw_data, getattr(inline, "mime_type", "image/png")))
                if len(images) >= num_images:
                    break
            if len(images) >= num_images:
                break

        if len(images) >= num_images:
            break

    if not images:
        raise HTTPException(status_code=502, detail="Gemini did not return image content")

    return model_name, images[:num_images]


def edit_image(
    instruction: str,
    original_image: str,
    reference_images: Optional[List[str]] = None,
    mask_image: Optional[str] = None,
    temperature: Optional[float] = None,
    seed: Optional[int] = None
) -> List[ImagePayload]:
    """Edit image using Gemini."""
    model = genai.GenerativeModel(model_name=GEMINI_FLASH_MODEL)
    
    instruction = instruction.strip()
    if not instruction:
        raise HTTPException(status_code=400, detail="Instruction cannot be empty")

    logger.info(
        "Processing edit request; mask_provided=%s reference_images=%d",
        bool(mask_image),
        len(reference_images or []),
    )

    prompt_text = (
        "GENERATE A NEW IMAGE based on the reference provided:\n\n"
        "REFERENCE IMAGE: The image below shows what you should use as a base.\n"
        f"MODIFICATION REQUEST: {instruction}\n\n"
        "INSTRUCTIONS:\n"
        "1. Generate a new image that incorporates the requested changes\n"
        "2. Maintain the overall composition, lighting, and style of the reference\n"
        "3. Make the changes look natural and seamlessly integrated\n"
        "4. Ensure the output is a complete, high-quality image\n\n"
        "OUTPUT: A single generated image that fulfills the modification request.\n"
    ) if mask_image else (
        f"GENERATE A NEW IMAGE based on this reference:\n\n"
        f"MODIFICATION REQUEST: {instruction}\n\n"
        "Create a new image that:\n"
        "- Uses the reference image as inspiration for composition and style\n"
        "- Incorporates the requested modifications naturally\n"
        "- Maintains consistent lighting, perspective, and quality\n"
        "- Looks like a cohesive, professionally edited photo\n"
    )

    parts: List[Dict[str, Any]] = [{"text": prompt_text}]

    try:
        parts.append({
            "inline_data": {
                "mime_type": "image/png",
                "data": normalize_base64(original_image),
            }
        })
    except Exception as exc:
        logger.warning("Invalid original image: %s", exc)
        raise HTTPException(status_code=400, detail=f"Invalid original image: {exc}") from exc

    if mask_image:
        try:
            parts.append({
                "inline_data": {
                    "mime_type": "image/png",
                    "data": normalize_base64(mask_image),
                }
            })
        except Exception as exc:
            logger.warning("Invalid mask image: %s", exc)
            raise HTTPException(status_code=400, detail=f"Invalid mask image: {exc}") from exc

    for ref_image in reference_images or []:
        try:
            parts.append({
                "inline_data": {
                    "mime_type": "image/png",
                    "data": normalize_base64(ref_image),
                }
            })
        except Exception as exc:
            logger.warning("Invalid reference image: %s", exc)
            raise HTTPException(status_code=400, detail=f"Invalid reference image: {exc}") from exc

    args = build_generation_args(temperature=temperature, seed=seed)

    try:
        logger.info("Sending edit request to Gemini model %s", GEMINI_FLASH_MODEL)
        result = model.generate_content([{"role": "user", "parts": parts}], **args)
    except Exception as exc:
        logger.exception("Gemini edit request failed")
        raise HTTPException(status_code=502, detail=f"Gemini edit failed: {type(exc).__name__}: {exc}") from exc

    images: List[ImagePayload] = []
    candidate_summaries: List[str] = []

    for index, candidate in enumerate(getattr(result, "candidates", []) or []):
        summary = summarize_candidate(candidate)
        text_snippet = extract_candidate_text(candidate)
        if text_snippet:
            candidate_summaries.append(f"candidate[{index}]: {summary}, text='{text_snippet}'")
        else:
            candidate_summaries.append(f"candidate[{index}]: {summary}")
        content = getattr(candidate, "content", None)
        if not content:
            continue
        for part in getattr(content, "parts", []) or []:
            inline = getattr(part, "inline_data", None)
            if inline and getattr(inline, "data", None):
                raw_data = inline.data if isinstance(inline.data, bytes) else bytes(inline.data)
                images.append(serialize_inline_image(raw_data, getattr(inline, "mime_type", "image/png")))

    prompt_feedback = summarize_prompt_feedback(getattr(result, "prompt_feedback", None))

    if not images:
        if candidate_summaries:
            logger.warning("Gemini edit returned no image content. Candidate details: %s", " | ".join(candidate_summaries))
        else:
            logger.warning("Gemini edit returned no image content and provided no candidates")

        debug_hint = candidate_summaries[0] if candidate_summaries else "no candidate summaries"
        if len(debug_hint) > 240:
            debug_hint = f"{debug_hint[:237]}..."

        if prompt_feedback:
            logger.warning("Prompt feedback: %s", prompt_feedback)
            debug_hint = f"{debug_hint}; feedback={prompt_feedback}"
        elif "finish_reason=1" in debug_hint:
            debug_hint = (
                f"{debug_hint}; guidance=Model stopped without emitting an image. "
                "Ensure the prompt explicitly requests visual output, "
                "avoid unsupported edits, and confirm your Google AI Studio key is "
                "enabled for image editing. Some Gemini models on AI Studio only "
                "support fresh image generation—consider switching to an Imagen/Vertex "
                "workflow if edits remain blocked."
            )

        raise HTTPException(
            status_code=502,
            detail=f"Gemini did not return edited image content ({debug_hint})",
        )

    logger.info("Gemini edit generated %d image(s)", len(images))
    return images


def improve_prompt(prompt: str, language: str = "en") -> str:
    """Improve an image generation prompt using Gemini."""
    model = genai.GenerativeModel(model_name=GEMINI_FLASH_MODEL)

    instruction_text = (
        "Improve the following image generation prompt by making it more descriptive, "
        "cinematic, and specific while preserving any placeholders like [subject]. "
        "Return only the improved prompt text without extra commentary.\n\n"
        f"Original Prompt:\n{prompt}"
    )

    if language.lower() == "zh":
        instruction_text = (
            "改进以下图像生成提示词，使其更具描述性、更有电影感和更具体，同时保留任何占位符（如 [主题]）。"
            "只返回改进后的提示词文本，不要添加额外的评论。\n\n"
            f"原始提示词:\n{prompt}"
        )

    try:
        response = model.generate_content([{"role": "user", "parts": [{"text": instruction_text}]}])
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Prompt improvement failed: {exc}") from exc

    for candidate in getattr(response, "candidates", []) or []:
        for part in getattr(getattr(candidate, "content", None), "parts", []) or []:
            text_value = getattr(part, "text", "")
            if text_value:
                return text_value.strip()

    raise HTTPException(status_code=502, detail="Prompt improvement did not return any text")


def segment_image(image: str, query: str) -> Dict[str, Any]:
    """Segment image using Gemini."""
    import json
    
    model = genai.GenerativeModel(model_name=GEMINI_FLASH_MODEL)

    instruction = (
        "Analyze this image and create a segmentation mask for:"
        f" {query}\n\n"
        "Return a JSON object with this exact structure:\n"
        "{\n"
        "  \"masks\": [\n"
        "    {\n"
        "      \"label\": \"description of the segmented object\",\n"
        "      \"box_2d\": [x, y, width, height],\n"
        "      \"mask\": \"base64-encoded binary mask image\"\n"
        "    }\n"
        "  ]\n"
        "}\n\n"
        "Only segment the specific object or region requested. The mask should be a binary PNG with white pixels"
        " (255) indicating the selected region and black pixels (0) indicating the background."
    )

    try:
        response = model.generate_content([
            {
                "role": "user",
                "parts": [
                    {"text": instruction},
                    {
                        "inline_data": {
                            "mime_type": "image/png",
                            "data": normalize_base64(image),
                        }
                    },
                ],
            }
        ])
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Segmentation failed: {exc}") from exc

    for candidate in getattr(response, "candidates", []) or []:
        for part in getattr(getattr(candidate, "content", None), "parts", []) or []:
            text_value = getattr(part, "text", "")
            if text_value:
                try:
                    return json.loads(text_value)
                except json.JSONDecodeError as exc:
                    raise HTTPException(status_code=502, detail=f"Invalid segmentation JSON: {exc}") from exc

    raise HTTPException(status_code=502, detail="Segmentation did not return any data")


def list_models() -> List[str]:
    """List available Gemini image generation models."""
    try:
        models = [
            "models/gemini-2.0-flash-exp",
            "models/gemini-exp-1206", 
            GEMINI_FLASH_MODEL,
        ]
        return models
    except Exception:
        return [GEMINI_FLASH_MODEL]
