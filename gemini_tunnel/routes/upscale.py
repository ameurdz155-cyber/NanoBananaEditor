"""Image upscaling and inpainting routes."""

from io import BytesIO
from typing import Dict, Any, Optional
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends
from PIL import Image
import uuid

from models import UpscaleRequest, UpscaleResponse, InpaintRequest, InpaintResponse
from services.imagen_service import upscale_with_google_imagen, inpaint_with_google_imagen
from utils import normalize_base64, serialize_inline_image
from database import get_table
from routes.auth_db import get_current_user

router = APIRouter(tags=["image-processing"])


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


@router.post("/upscale", response_model=UpscaleResponse)
async def upscale_image(
    payload: UpscaleRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> UpscaleResponse:
    """Upscale an image using Google Imagen AI model."""
    
    scale_factor = payload.scale
    if scale_factor not in [2, 4]:
        scale_factor = 4
    
    # Create queue item
    queue_id = create_queue_item(
        user_id=current_user["id"],
        type="upscale",
        prompt=f"Upscale {scale_factor}x"
    )
    
    try:
        # Update status to processing
        update_queue_item(queue_id, "processing", progress=10)
        
        image_bytes = normalize_base64(payload.image)
        
        try:
            with Image.open(BytesIO(image_bytes)) as img:
                if img.width > 2048 or img.height > 2048:
                    raise HTTPException(
                        status_code=400, 
                        detail=f"Image too large ({img.width}x{img.height}). Maximum size is 2048x2048 pixels."
                    )
                
                original_size = f"{img.width}x{img.height}"
                
        except Exception as exc:
            raise HTTPException(status_code=400, detail=f"Invalid image format: {exc}") from exc
        
        # Update progress
        update_queue_item(queue_id, "processing", progress=30)
        
        upscaled_bytes = upscale_with_google_imagen(image_bytes, scale_factor)
        
        try:
            with Image.open(BytesIO(upscaled_bytes)) as upscaled_img:
                new_size = f"{upscaled_img.width}x{upscaled_img.height}"
        except:
            new_size = "unknown"
        
        print(f"Successfully upscaled image from {original_size} to {new_size} (scale: {scale_factor}x)")
        
        # Update progress
        update_queue_item(queue_id, "processing", progress=90)
        
        upscaled_image = serialize_inline_image(upscaled_bytes)
        
        # Mark as completed
        update_queue_item(queue_id, "completed", progress=100, result_url=upscaled_image)
        
        return UpscaleResponse(
            model="google-imagen-upscale",
            scale=scale_factor,
            image=upscaled_image,
        )
        
    except HTTPException as he:
        # Mark as failed
        update_queue_item(queue_id, "failed", progress=0, error_message=str(he.detail))
        raise
    except Exception as exc:
        # Mark as failed
        update_queue_item(queue_id, "failed", progress=0, error_message=str(exc))
        raise HTTPException(status_code=500, detail=f"Upscaling failed: {str(exc)}") from exc


@router.post("/inpaint", response_model=InpaintResponse)
async def inpaint_image(
    payload: InpaintRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> InpaintResponse:
    """Insert objects into an image using Google Imagen inpainting."""
    
    # Create queue item
    queue_id = create_queue_item(
        user_id=current_user["id"],
        type="inpaint",
        prompt=payload.prompt
    )
    
    try:
        # Update status to processing
        update_queue_item(queue_id, "processing", progress=10)
        image_bytes = normalize_base64(payload.image)
        
        try:
            with Image.open(BytesIO(image_bytes)) as img:
                if img.width > 2048 or img.height > 2048:
                    raise HTTPException(
                        status_code=400, 
                        detail=f"Image too large ({img.width}x{img.height}). Maximum size is 2048x2048 pixels."
                    )
                
                original_size = f"{img.width}x{img.height}"
                
        except Exception as exc:
            raise HTTPException(status_code=400, detail=f"Invalid image format: {exc}") from exc
        
        mask_image_bytes = None
        if payload.mask_image:
            try:
                mask_image_bytes = normalize_base64(payload.mask_image)
                with Image.open(BytesIO(mask_image_bytes)) as mask_img:
                    if mask_img.size != (img.width, img.height):
                        raise HTTPException(
                            status_code=400,
                            detail=f"Mask image size ({mask_img.width}x{mask_img.height}) must match base image size ({img.width}x{img.height})"
                        )
            except HTTPException:
                raise
            except Exception as exc:
                raise HTTPException(status_code=400, detail=f"Invalid mask image: {exc}") from exc
        
        valid_mask_modes = [
            "MASK_MODE_USER_PROVIDED", 
            "MASK_MODE_BACKGROUND", 
            "MASK_MODE_FOREGROUND", 
            "MASK_MODE_SEMANTIC"
        ]
        
        if payload.mask_mode not in valid_mask_modes:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid mask_mode. Must be one of: {', '.join(valid_mask_modes)}"
            )
        
        if payload.mask_mode == "MASK_MODE_USER_PROVIDED" and not mask_image_bytes:
            raise HTTPException(
                status_code=400,
                detail="mask_image is required when mask_mode is MASK_MODE_USER_PROVIDED"
            )
        
        if payload.mask_mode == "MASK_MODE_SEMANTIC" and not payload.mask_classes:
            raise HTTPException(
                status_code=400,
                detail="mask_classes is required when mask_mode is MASK_MODE_SEMANTIC"
            )
        
        print(f"Starting inpainting: {original_size}, prompt: '{payload.prompt[:50]}...', mode: {payload.mask_mode}")
        
        # Update progress
        update_queue_item(queue_id, "processing", progress=30)
        
        edited_images_bytes = inpaint_with_google_imagen(
            image_data=image_bytes,
            prompt=payload.prompt,
            mask_image_data=mask_image_bytes,
            mask_mode=payload.mask_mode,
            mask_classes=payload.mask_classes,
            mask_dilation=payload.mask_dilation,
            edit_steps=payload.edit_steps,
            sample_count=payload.sample_count
        )
        
        # Update progress
        update_queue_item(queue_id, "processing", progress=80)
        
        images = []
        for i, img_bytes in enumerate(edited_images_bytes):
            images.append(serialize_inline_image(img_bytes))
            print(f"Generated image {i+1}/{len(edited_images_bytes)}: {len(img_bytes)} bytes")
        
        print(f"✓ Inpainting completed: {len(images)} image(s) generated")
        
        # Mark as completed
        result_url = images[0] if images else None
        update_queue_item(queue_id, "completed", progress=100, result_url=result_url)
        
        return InpaintResponse(
            model="google-imagen-3.0-inpaint",
            images=images,
            edit_steps=payload.edit_steps,
            sample_count=len(images)
        )
        
    except HTTPException as he:
        # Mark as failed
        update_queue_item(queue_id, "failed", progress=0, error_message=str(he.detail))
        raise
    except Exception as exc:
        # Mark as failed
        update_queue_item(queue_id, "failed", progress=0, error_message=str(exc))
        raise HTTPException(status_code=500, detail=f"Inpainting failed: {str(exc)}") from exc
