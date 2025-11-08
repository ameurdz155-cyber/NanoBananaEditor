"""Image editing routes."""

from fastapi import APIRouter

from models import EditRequest, EditResponse
from services.gemini_service import edit_image
from config import GEMINI_FLASH_MODEL

router = APIRouter(tags=["editing"])


@router.post("/edit/gemini", response_model=EditResponse)
async def edit_with_gemini(payload: EditRequest) -> EditResponse:
    """Edit an image using Gemini AI."""
    images = edit_image(
        instruction=payload.instruction,
        original_image=payload.original_image,
        reference_images=payload.reference_images,
        mask_image=payload.mask_image,
        temperature=payload.temperature,
        seed=payload.seed
    )
    return EditResponse(model=GEMINI_FLASH_MODEL, images=images)
