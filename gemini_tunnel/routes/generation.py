"""Image generation routes."""

from typing import Any, Dict, List
from fastapi import APIRouter

from models import (
    ImageRequest,
    ImagenRequest,
    GenerateResponse,
    ImprovePromptRequest,
    ImprovePromptResponse,
    SegmentationRequest
)
from services.gemini_service import (
    generate_images,
    improve_prompt,
    segment_image,
    list_models
)
from config import GEMINI_FLASH_MODEL

router = APIRouter(tags=["generation"])


@router.post("/generate/gemini", response_model=GenerateResponse)
async def generate_with_gemini(payload: ImageRequest) -> GenerateResponse:
    """Generate images using Gemini AI."""
    model_name, images = generate_images(
        prompt=payload.prompt,
        negative_prompt=payload.negative_prompt,
        reference_images=payload.reference_images,
        temperature=payload.temperature,
        seed=payload.seed,
        aspect_ratio=payload.aspect_ratio,
        width=payload.width,
        height=payload.height,
        num_images=payload.num_images,
        model=payload.model
    )
    return GenerateResponse(model=model_name, images=images)


@router.post("/generate/imagen", response_model=GenerateResponse)
async def generate_with_imagen(payload: ImagenRequest) -> GenerateResponse:
    """Generate images using Imagen - For now, uses Gemini Flash as Imagen API requires different setup."""
    
    print("⚠️  Note: Imagen models require Vertex AI setup. Using Gemini Flash for image generation.")
    
    model_name, images = generate_images(
        prompt=payload.prompt,
        negative_prompt=payload.negative_prompt,
        reference_images=payload.reference_images,
        temperature=payload.temperature,
        seed=payload.seed,
        aspect_ratio=payload.aspect_ratio,
        width=payload.width,
        height=payload.height,
        num_images=payload.num_images,
        model=GEMINI_FLASH_MODEL
    )
    
    return GenerateResponse(model=model_name, images=images)


@router.get("/models/imagen")
async def list_imagen_models() -> dict[str, List[str]]:
    """List available image generation models."""
    models = list_models()
    return {"models": models}


@router.post("/prompt/improve", response_model=ImprovePromptResponse)
async def improve_prompt_route(payload: ImprovePromptRequest) -> ImprovePromptResponse:
    """Improve an image generation prompt."""
    improved = improve_prompt(payload.prompt, payload.language)
    return ImprovePromptResponse(prompt=improved)


@router.post("/segment/gemini")
async def segment_image_route(payload: SegmentationRequest) -> Dict[str, Any]:
    """Segment objects in an image."""
    result = segment_image(payload.image, payload.query)
    return result
