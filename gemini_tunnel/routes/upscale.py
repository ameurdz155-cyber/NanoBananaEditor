"""Image upscaling and inpainting routes."""

from io import BytesIO
from fastapi import APIRouter, HTTPException
from PIL import Image

from models import UpscaleRequest, UpscaleResponse, InpaintRequest, InpaintResponse
from services.imagen_service import upscale_with_google_imagen, inpaint_with_google_imagen
from utils import normalize_base64, serialize_inline_image

router = APIRouter(tags=["image-processing"])


@router.post("/upscale", response_model=UpscaleResponse)
async def upscale_image(payload: UpscaleRequest) -> UpscaleResponse:
    """Upscale an image using Google Imagen AI model."""
    
    scale_factor = payload.scale
    if scale_factor not in [2, 4]:
        scale_factor = 4
    
    try:
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
        
        upscaled_bytes = upscale_with_google_imagen(image_bytes, scale_factor)
        
        try:
            with Image.open(BytesIO(upscaled_bytes)) as upscaled_img:
                new_size = f"{upscaled_img.width}x{upscaled_img.height}"
        except:
            new_size = "unknown"
        
        print(f"Successfully upscaled image from {original_size} to {new_size} (scale: {scale_factor}x)")
        
        upscaled_image = serialize_inline_image(upscaled_bytes)
        
        return UpscaleResponse(
            model="google-imagen-upscale",
            scale=scale_factor,
            image=upscaled_image,
        )
        
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Upscaling failed: {str(exc)}") from exc


@router.post("/inpaint", response_model=InpaintResponse)
async def inpaint_image(payload: InpaintRequest) -> InpaintResponse:
    """Insert objects into an image using Google Imagen inpainting."""
    
    try:
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
        
        images = []
        for i, img_bytes in enumerate(edited_images_bytes):
            images.append(serialize_inline_image(img_bytes))
            print(f"Generated image {i+1}/{len(edited_images_bytes)}: {len(img_bytes)} bytes")
        
        print(f"✓ Inpainting completed: {len(images)} image(s) generated")
        
        return InpaintResponse(
            model="google-imagen-3.0-inpaint",
            images=images,
            edit_steps=payload.edit_steps,
            sample_count=len(images)
        )
        
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Inpainting failed: {str(exc)}") from exc
