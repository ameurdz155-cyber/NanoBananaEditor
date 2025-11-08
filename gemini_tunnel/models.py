"""Pydantic models for request/response validation."""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class ImageRequest(BaseModel):
    prompt: str = Field(..., min_length=4, max_length=2000)
    negative_prompt: Optional[str] = Field(default=None, max_length=2000)
    reference_images: Optional[List[str]] = Field(default=None, description="List of base64-encoded PNG images")
    temperature: Optional[float] = Field(default=None, ge=0, le=2)
    seed: Optional[int] = Field(default=None, ge=0)
    aspect_ratio: Optional[str] = Field(default=None, pattern=r"^\d+:\d+$")
    width: Optional[int] = Field(default=None, ge=64, le=2048)
    height: Optional[int] = Field(default=None, ge=64, le=2048)
    num_images: int = Field(default=1, ge=1, le=4)
    model: Optional[str] = Field(default=None, min_length=1, max_length=128)


class ImagenRequest(ImageRequest):
    pass


class ImagePayload(BaseModel):
    mime_type: str
    b64_data: str


class GenerateResponse(BaseModel):
    model: str
    images: List[ImagePayload]


class EditRequest(BaseModel):
    instruction: str = Field(..., min_length=4, max_length=2000)
    original_image: str = Field(..., description="Base64 encoded original PNG image")
    reference_images: Optional[List[str]] = Field(default=None)
    mask_image: Optional[str] = None
    temperature: Optional[float] = Field(default=None, ge=0, le=2)
    seed: Optional[int] = Field(default=None, ge=0)


class EditResponse(BaseModel):
    model: str
    images: List[ImagePayload]


class ImprovePromptRequest(BaseModel):
    prompt: str = Field(..., min_length=4, max_length=4000)
    language: str = Field(default="en", pattern=r"^[a-z]{2}$")


class ImprovePromptResponse(BaseModel):
    prompt: str


class SegmentationRequest(BaseModel):
    image: str = Field(..., description="Base64 encoded image to segment")
    query: str = Field(..., min_length=3, max_length=500)


class UpscaleRequest(BaseModel):
    image: str = Field(..., description="Base64 encoded source image to upscale")
    scale: int = Field(default=4, ge=1, le=8, description="Upscale factor (2 or 4 supported, others will be normalized)")
    model: Optional[str] = Field(default=None, min_length=1, max_length=128, description="Model name (uses Google Imagen)")


class UpscaleResponse(BaseModel):
    model: str
    scale: int
    image: ImagePayload


class InpaintRequest(BaseModel):
    image: str = Field(..., description="Base64 encoded source image to edit")
    prompt: str = Field(..., min_length=4, max_length=2000, description="Text prompt describing what to insert")
    mask_image: Optional[str] = Field(default=None, description="Base64 encoded mask image (white=edit area, black=preserve)")
    mask_mode: Optional[str] = Field(
        default="MASK_MODE_USER_PROVIDED",
        description="Mask mode: MASK_MODE_USER_PROVIDED, MASK_MODE_BACKGROUND, MASK_MODE_FOREGROUND, MASK_MODE_SEMANTIC"
    )
    mask_classes: Optional[List[int]] = Field(default=None, description="Semantic mask class IDs (for MASK_MODE_SEMANTIC)")
    mask_dilation: float = Field(default=0.01, ge=0.0, le=1.0, description="Mask dilation percentage (0.01 recommended)")
    edit_steps: int = Field(default=35, ge=1, le=75, description="Number of sampling steps (35-75)")
    sample_count: int = Field(default=1, ge=1, le=4, description="Number of images to generate")
    model: Optional[str] = Field(default=None, min_length=1, max_length=128, description="Model name (uses Google Imagen)")


class InpaintResponse(BaseModel):
    model: str
    images: List[ImagePayload]
    edit_steps: int
    sample_count: int


class LoginRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=64)
    password: str = Field(..., min_length=3, max_length=128)


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    username: str


class OAuthUrlResponse(BaseModel):
    auth_url: str
    message: str


class OAuthCallbackRequest(BaseModel):
    code: str
    state: str


class OAuthTokenResponse(BaseModel):
    success: bool
    message: str
    token_valid: bool = False
