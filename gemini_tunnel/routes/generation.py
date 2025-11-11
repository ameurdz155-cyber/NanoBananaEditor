"""Image generation routes."""

from typing import Any, Dict, List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends
import uuid

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
from database import get_table
from routes.auth_db import get_current_user

router = APIRouter(tags=["generation"])


def create_queue_item(user_id: str, type: str, prompt: str, preview_url: Optional[str] = None) -> str:
    """Create a queue item and return its ID."""
    queue_table = get_table("queue")
    now = datetime.utcnow().isoformat()
    
    queue_item = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "type": type,
        "status": "pending",
        "prompt": prompt,
        "preview_url": preview_url,
        "result_url": None,
        "error_message": None,
        "progress": 0,
        "created_at": now,
        "updated_at": now,
        "completed_at": None,
        "metadata": {}
    }
    
    queue_table.insert(queue_item)
    return queue_item["id"]


def update_queue_item(item_id: str, status: str, progress: int = 0, result_url: Optional[str] = None, error_message: Optional[str] = None):
    """Update a queue item status and progress."""
    queue_table = get_table("queue")
    from tinydb import Query
    QueueQuery = Query()
    
    now = datetime.utcnow().isoformat()
    updates = {
        "status": status,
        "progress": progress,
        "updated_at": now
    }
    
    if status in ["completed", "failed"]:
        updates["completed_at"] = now
    
    if result_url:
        updates["result_url"] = result_url
    
    if error_message:
        updates["error_message"] = error_message
    
    queue_table.update(updates, QueueQuery.id == item_id)


@router.post("/generate/gemini", response_model=GenerateResponse)
async def generate_with_gemini(
    payload: ImageRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> GenerateResponse:
    """Generate images using Gemini AI."""
    # Create queue item with metadata
    queue_table = get_table("queue")
    now = datetime.utcnow().isoformat()
    queue_id = str(uuid.uuid4())
    
    queue_item = {
        "id": queue_id,
        "user_id": current_user["id"],
        "type": "generation",
        "status": "pending",
        "prompt": payload.prompt,
        "preview_url": None,
        "result_url": None,
        "error_message": None,
        "progress": 0,
        "created_at": now,
        "updated_at": now,
        "completed_at": None,
        "metadata": {
            "negativePrompt": payload.negative_prompt,
            "aspectRatio": payload.aspect_ratio,
            "width": payload.width,
            "height": payload.height,
            "seed": payload.seed,
            "temperature": payload.temperature,
            "numImages": payload.num_images,
            "modelVersion": payload.model,
            "referenceCount": len(payload.reference_images or [])
        }
    }
    queue_table.insert(queue_item)
    
    try:
        # Update status to processing
        update_queue_item(queue_id, "processing", progress=10)
        
        # Generate images
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
        
        # Update progress
        update_queue_item(queue_id, "processing", progress=90)
        
        # Mark as completed with first image as result (convert ImagePayload to string)
        result_url = None
        if images:
            first_image = images[0]
            # Store as data URL string for JSON serialization
            result_url = f"data:{first_image.mime_type};base64,{first_image.b64_data}"
        update_queue_item(queue_id, "completed", progress=100, result_url=result_url)
        
        return GenerateResponse(model=model_name, images=images)
    except Exception as e:
        # Mark as failed
        update_queue_item(queue_id, "failed", progress=0, error_message=str(e))
        raise


@router.post("/generate/gemini/bulk", response_model=List[GenerateResponse])
async def generate_with_gemini_bulk(
    payloads: List[ImageRequest],
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> List[GenerateResponse]:
    """
    Generate multiple images simultaneously using Gemini AI.
    This endpoint processes multiple generation requests in parallel for better performance.
    """
    import asyncio
    
    async def process_single_generation(payload: ImageRequest) -> GenerateResponse:
        """Process a single generation request asynchronously."""
        queue_table = get_table("queue")
        now = datetime.utcnow().isoformat()
        queue_id = str(uuid.uuid4())
        
        queue_item = {
            "id": queue_id,
            "user_id": current_user["id"],
            "type": "generation",
            "status": "pending",
            "prompt": payload.prompt,
            "preview_url": None,
            "result_url": None,
            "error_message": None,
            "progress": 0,
            "created_at": now,
            "updated_at": now,
            "completed_at": None,
            "metadata": {
                "negativePrompt": payload.negative_prompt,
                "aspectRatio": payload.aspect_ratio,
                "width": payload.width,
                "height": payload.height,
                "seed": payload.seed,
                "temperature": payload.temperature,
                "numImages": payload.num_images,
                "modelVersion": payload.model,
                "referenceCount": len(payload.reference_images or [])
            }
        }
        queue_table.insert(queue_item)
        
        try:
            # Update status to processing
            update_queue_item(queue_id, "processing", progress=10)
            
            # Generate images in thread pool to avoid blocking
            loop = asyncio.get_event_loop()
            model_name, images = await loop.run_in_executor(
                None,
                generate_images,
                payload.prompt,
                payload.negative_prompt,
                payload.reference_images,
                payload.temperature,
                payload.seed,
                payload.aspect_ratio,
                payload.width,
                payload.height,
                payload.num_images,
                payload.model
            )
            
            # Update progress
            update_queue_item(queue_id, "processing", progress=90)
            
            # Mark as completed with first image as result
            result_url = None
            if images:
                first_image = images[0]
                result_url = f"data:{first_image.mime_type};base64,{first_image.b64_data}"
            update_queue_item(queue_id, "completed", progress=100, result_url=result_url)
            
            return GenerateResponse(model=model_name, images=images)
        except Exception as e:
            # Mark as failed
            update_queue_item(queue_id, "failed", progress=0, error_message=str(e))
            raise
    
    # Process all generations in parallel
    try:
        results = await asyncio.gather(
            *[process_single_generation(payload) for payload in payloads],
            return_exceptions=True
        )
        
        # Filter out exceptions and return successful results
        successful_results = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                print(f"⚠️  Bulk generation item {i+1} failed: {str(result)}")
            else:
                successful_results.append(result)
        
        return successful_results
    except Exception as e:
        print(f"❌ Bulk generation failed: {str(e)}")
        raise


@router.post("/generate/imagen", response_model=GenerateResponse)
async def generate_with_imagen(
    payload: ImagenRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> GenerateResponse:
    """Generate images using Imagen - For now, uses Gemini Flash as Imagen API requires different setup."""
    
    print("⚠️  Note: Imagen models require Vertex AI setup. Using Gemini Flash for image generation.")
    
    # Create queue item with metadata
    queue_table = get_table("queue")
    now = datetime.utcnow().isoformat()
    queue_id = str(uuid.uuid4())
    
    queue_item = {
        "id": queue_id,
        "user_id": current_user["id"],
        "type": "generation",
        "status": "pending",
        "prompt": payload.prompt,
        "preview_url": None,
        "result_url": None,
        "error_message": None,
        "progress": 0,
        "created_at": now,
        "updated_at": now,
        "completed_at": None,
        "metadata": {
            "negativePrompt": payload.negative_prompt,
            "aspectRatio": payload.aspect_ratio,
            "width": payload.width,
            "height": payload.height,
            "seed": payload.seed,
            "temperature": payload.temperature,
            "numImages": payload.num_images,
            "modelVersion": GEMINI_FLASH_MODEL,
            "referenceCount": len(payload.reference_images or [])
        }
    }
    queue_table.insert(queue_item)
    
    try:
        # Update status to processing
        update_queue_item(queue_id, "processing", progress=10)
        
        # Generate images
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
        
        # Update progress
        update_queue_item(queue_id, "processing", progress=90)
        
        # Mark as completed with first image as result (convert ImagePayload to string)
        result_url = None
        if images:
            first_image = images[0]
            # Store as data URL string for JSON serialization
            result_url = f"data:{first_image.mime_type};base64,{first_image.b64_data}"
        update_queue_item(queue_id, "completed", progress=100, result_url=result_url)
        
        return GenerateResponse(model=model_name, images=images)
    except Exception as e:
        # Mark as failed
        update_queue_item(queue_id, "failed", progress=0, error_message=str(e))
        raise


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
