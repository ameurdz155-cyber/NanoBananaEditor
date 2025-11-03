import base64
import json
import os
import requests
from typing import Any, Dict, List, Optional
from io import BytesIO

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from PIL import Image
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow

import google.generativeai as genai

load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    raise RuntimeError("GEMINI_API_KEY environment variable is missing")

GEMINI_FLASH_MODEL = os.getenv("GEMINI_FLASH_MODEL", "models/gemini-2.5-flash-image")
# Use a Generative API compatible Imagen model name by default. The SDK
# typically expects model names in the "models/..." format when using
# genai.GenerativeModel. Use the generate-capable Imagen model.
IMAGEN_MODEL = os.getenv("IMAGEN_MODEL", "models/imagen-3.0-generate-002")
AUTH_USERNAME = os.getenv("AUTH_USERNAME", "admin")
AUTH_PASSWORD = os.getenv("AUTH_PASSWORD", "admin")

# Google Cloud Configuration
GOOGLE_CLOUD_PROJECT_ID = os.getenv("GOOGLE_CLOUD_PROJECT_ID", "gen-lang-client-0772017905")
GOOGLE_CLOUD_LOCATION = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")
GOOGLE_APPLICATION_CREDENTIALS = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "credentials.json")

DEFAULT_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
    "https://aipod-lite.findapply.com",
]

raw_origins = os.getenv("ALLOWED_ORIGINS", "")

if raw_origins.strip():
    allowed_origins = [origin.strip() for origin in raw_origins.split(",") if origin.strip()]
else:
    allowed_origins = DEFAULT_ALLOWED_ORIGINS

allow_all_origins = "*" in allowed_origins

if allow_all_origins:
    allowed_origins = ["*"]

# Configure the Gemini client once so requests reuse the same credentials.
genai.configure(api_key=API_KEY)

app = FastAPI(title="Gemini Image Tunnel", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if allow_all_origins else allowed_origins,
    allow_credentials=not allow_all_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _normalize_base64(data: str) -> bytes:
    """Return raw bytes from a base64 string or data URL."""
    if not data:
        raise ValueError("Empty image payload")
    if "," in data and data.strip().startswith("data:"):
        data = data.split(",", 1)[1]
    return base64.b64decode(data)


def _serialize_inline_image(data: bytes, mime_type: str = "image/png") -> "ImagePayload":
    return ImagePayload(mime_type=mime_type, b64_data=base64.b64encode(data).decode("ascii"))


def _get_google_cloud_access_token() -> Optional[str]:
    """Get access token for Google Cloud from saved credentials."""
    credentials_path = GOOGLE_APPLICATION_CREDENTIALS
    
    # If it's a relative path, make it absolute
    if not os.path.isabs(credentials_path):
        credentials_path = os.path.join(os.path.dirname(__file__), credentials_path)
    
    if not os.path.exists(credentials_path):
        print(f"❌ Credentials file not found at: {credentials_path}")
        return None
    
    try:
        creds = Credentials.from_authorized_user_file("token.json")
        
        # Refresh token if needed
        if not creds.valid:
            if creds.expired and creds.refresh_token:
                creds.refresh(Request())
            else:
                print("❌ Credentials expired and cannot be refreshed")
                return None
        
        return creds.token
    except Exception as e:
        print(f"❌ Error loading credentials: {e}")
        return None


def _upscale_with_google_imagen(image_data: bytes, upscale_factor: int) -> Optional[bytes]:
    """Upscale image using Google Imagen via REST API."""
    
    # Get access token
    access_token = _get_google_cloud_access_token()
    if not access_token:
        raise HTTPException(status_code=401, detail="Google Cloud authentication failed. Please check credentials.")
    
    # Validate upscale factor
    if upscale_factor not in [2, 4]:
        upscale_factor = 4  # Default to 4x if invalid
    
    # Encode image to base64
    encoded_string = base64.b64encode(image_data).decode("utf-8")
    
    # Prepare the REST API request
    url = f"https://{GOOGLE_CLOUD_LOCATION}-aiplatform.googleapis.com/v1/projects/{GOOGLE_CLOUD_PROJECT_ID}/locations/{GOOGLE_CLOUD_LOCATION}/publishers/google/models/imagegeneration@006:predict"
    
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    # Create the request payload
    payload = {
        "instances": [
            {
                "image": {
                    "bytesBase64Encoded": encoded_string
                },
                "prompt": ""  # Empty prompt for upscaling
            }
        ],
        "parameters": {
            "sampleCount": 1,
            "mode": "upscale",
            "upscaleConfig": {
                "upscaleFactor": f"x{upscale_factor}"
            }
        }
    }

    # Make the API call
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=120)
        
        if response.status_code != 200:
            error_msg = f"Google Cloud API request failed with status {response.status_code}"
            if response.status_code == 403:
                error_msg += ". Check if Vertex AI API is enabled and billing is configured."
            elif response.status_code == 404:
                error_msg += ". Model not available in this region."
            raise HTTPException(status_code=502, detail=error_msg)
        
        result = response.json()
        
        # Extract the upscaled image
        if "predictions" not in result or len(result["predictions"]) == 0:
            raise HTTPException(status_code=502, detail="No predictions returned from Google Cloud API")
        
        prediction = result["predictions"][0]
        
        if "bytesBase64Encoded" not in prediction:
            raise HTTPException(status_code=502, detail="No image data in Google Cloud API response")
        
        upscaled_base64 = prediction["bytesBase64Encoded"]
        return base64.b64decode(upscaled_base64)
        
    except requests.exceptions.Timeout:
        raise HTTPException(status_code=504, detail="Google Cloud API request timed out")
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=502, detail=f"Network error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Upscaling failed: {str(e)}")


def _inpaint_with_google_imagen(
    image_data: bytes, 
    prompt: str,
    mask_image_data: Optional[bytes] = None,
    mask_mode: str = "MASK_MODE_USER_PROVIDED",
    mask_classes: Optional[List[int]] = None,
    mask_dilation: float = 0.01,
    edit_steps: int = 35,
    sample_count: int = 1
) -> List[bytes]:
    """Insert objects into image using Google Imagen inpainting."""
    
    # Get access token
    access_token = _get_google_cloud_access_token()
    if not access_token:
        raise HTTPException(status_code=401, detail="Google Cloud authentication failed. Please check credentials.")
    
    # Encode base image to base64
    base_image_b64 = base64.b64encode(image_data).decode("utf-8")
    
    # Prepare the REST API request
    url = f"https://{GOOGLE_CLOUD_LOCATION}-aiplatform.googleapis.com/v1/projects/{GOOGLE_CLOUD_PROJECT_ID}/locations/{GOOGLE_CLOUD_LOCATION}/publishers/google/models/imagen-3.0-capability-001:predict"
    
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    # Build reference images array
    reference_images = [
        {
            "referenceType": "REFERENCE_TYPE_RAW",
            "referenceId": 1,
            "referenceImage": {
                "bytesBase64Encoded": base_image_b64
            }
        }
    ]
    
    # Add mask configuration
    if mask_mode == "MASK_MODE_USER_PROVIDED" and mask_image_data:
        # User-provided mask
        mask_image_b64 = base64.b64encode(mask_image_data).decode("utf-8")
        reference_images.append({
            "referenceType": "REFERENCE_TYPE_MASK",
            "referenceImage": {
                "bytesBase64Encoded": mask_image_b64
            },
            "maskImageConfig": {
                "maskMode": mask_mode,
                "dilation": mask_dilation
            }
        })
    else:
        # Automatic mask detection
        mask_config = {
            "maskMode": mask_mode,
            "dilation": mask_dilation
        }
        
        # Add semantic mask classes if specified
        if mask_mode == "MASK_MODE_SEMANTIC" and mask_classes:
            mask_config["maskClasses"] = mask_classes
            
        reference_images.append({
            "referenceType": "REFERENCE_TYPE_MASK",
            "referenceId": 2,
            "maskImageConfig": mask_config
        })
    
    # Create the request payload
    payload = {
        "instances": [
            {
                "prompt": prompt,
                "referenceImages": reference_images
            }
        ],
        "parameters": {
            "editConfig": {
                "baseSteps": edit_steps
            },
            "editMode": "EDIT_MODE_INPAINT_INSERTION",
            "sampleCount": sample_count
        }
    }

    # Make the API call
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=180)
        
        if response.status_code != 200:
            error_msg = f"Google Cloud API request failed with status {response.status_code}"
            if response.status_code == 403:
                error_msg += ". Check if Vertex AI API is enabled and billing is configured."
            elif response.status_code == 404:
                error_msg += ". Model not available in this region."
            elif response.status_code == 400:
                try:
                    error_detail = response.json()
                    error_msg += f". Error details: {error_detail}"
                except:
                    error_msg += f". Response: {response.text}"
            raise HTTPException(status_code=502, detail=error_msg)
        
        result = response.json()
        
        # Extract the edited images
        if "predictions" not in result or len(result["predictions"]) == 0:
            raise HTTPException(status_code=502, detail="No predictions returned from Google Cloud API")
        
        edited_images = []
        for prediction in result["predictions"]:
            if "bytesBase64Encoded" not in prediction:
                continue
            image_bytes = base64.b64decode(prediction["bytesBase64Encoded"])
            edited_images.append(image_bytes)
        
        if not edited_images:
            raise HTTPException(status_code=502, detail="No image data in Google Cloud API response")
        
        return edited_images
        
    except requests.exceptions.Timeout:
        raise HTTPException(status_code=504, detail="Google Cloud API request timed out")
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=502, detail=f"Network error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Inpainting failed: {str(e)}")


def _serialize_inline_image(data: bytes, mime_type: str = "image/png") -> "ImagePayload":
    return ImagePayload(mime_type=mime_type, b64_data=base64.b64encode(data).decode("ascii"))


def _build_generation_parts(prompt_text: str, reference_images: Optional[List[str]] = None) -> List[Dict[str, Any]]:
    parts: List[Dict[str, Any]] = [
        {"text": "You are an image generator. Reply with image data only."},
        {"text": prompt_text},
    ]

    for image_str in reference_images or []:
        try:
            raw_bytes = _normalize_base64(image_str)
        except Exception as exc:  # pragma: no cover - validation handled later
            raise HTTPException(status_code=400, detail=f"Invalid reference image: {exc}") from exc

        parts.append(
            {
                "inline_data": {
                    "mime_type": "image/png",
                    "data": raw_bytes,
                }
            }
        )

    return parts


def _build_generation_args(
    *,
    temperature: Optional[float],
    seed: Optional[int],
) -> Dict[str, Any]:
    generation_config: Dict[str, Any] = {}
    if temperature is not None:
        generation_config["temperature"] = temperature
    if seed is not None:
        generation_config["seed"] = seed

    args: Dict[str, Any] = {}
    if generation_config:
        args["generation_config"] = generation_config

    return args


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


class UpscaleResponse(BaseModel):
    model: str
    scale: int
    image: ImagePayload


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


@app.get("/health")
async def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/generate/gemini", response_model=GenerateResponse)
async def generate_with_gemini(payload: ImageRequest) -> GenerateResponse:
    model_name = (payload.model or GEMINI_FLASH_MODEL).strip() or GEMINI_FLASH_MODEL
    model = genai.GenerativeModel(model_name=model_name)

    prompt_text = payload.prompt

    dimension_hints: list[str] = []
    if payload.aspect_ratio:
        dimension_hints.append(f"Desired aspect ratio: {payload.aspect_ratio}")
    if payload.width and payload.height:
        dimension_hints.append(f"Preferred output resolution: {payload.width}x{payload.height} pixels")
    if dimension_hints:
        prompt_text = "\n".join([prompt_text, *dimension_hints])

    if payload.negative_prompt:
        prompt_text = f"{prompt_text}\nDo not include: {payload.negative_prompt}"

    parts = _build_generation_parts(prompt_text, payload.reference_images)
    args = _build_generation_args(
        temperature=payload.temperature,
        seed=payload.seed,
    )

    images: List[ImagePayload] = []
    attempts = max(1, payload.num_images)

    for _ in range(attempts):
        try:
            result = model.generate_content([
                {
                    "role": "user",
                    "parts": parts,
                }
            ], **args)
        except Exception as exc:  # pragma: no cover
            raise HTTPException(status_code=502, detail=f"Gemini request failed: {exc}") from exc

        for candidate in getattr(result, "candidates", []) or []:
            content = getattr(candidate, "content", None)
            if not content:
                continue
            for part in getattr(content, "parts", []) or []:
                inline = getattr(part, "inline_data", None)
                if inline and getattr(inline, "data", None):
                    raw_data = inline.data if isinstance(inline.data, bytes) else bytes(inline.data)
                    images.append(_serialize_inline_image(raw_data, getattr(inline, "mime_type", "image/png")))
                if len(images) >= payload.num_images:
                    break
            if len(images) >= payload.num_images:
                break

        if len(images) >= payload.num_images:
            break

    if not images:
        raise HTTPException(status_code=502, detail="Gemini did not return image content")

    return GenerateResponse(model=model_name, images=images[: payload.num_images])


@app.post("/generate/imagen", response_model=GenerateResponse)
async def generate_with_imagen(payload: ImagenRequest) -> GenerateResponse:
    """Generate images using Imagen - For now, uses Gemini Flash as Imagen API requires different setup"""
    
    # Note: Imagen models require Vertex AI and different API endpoints
    # For now, fall back to Gemini Flash which can generate images
    print("⚠️  Note: Imagen models require Vertex AI setup. Using Gemini Flash for image generation.")
    
    # Use Gemini Flash model which supports image generation
    model_name = GEMINI_FLASH_MODEL
    
    try:
        model = genai.GenerativeModel(model_name=model_name)
    except Exception as exc:
        print(f"❌ Failed to initialize model: {exc}")
        raise HTTPException(status_code=500, detail=f"Failed to initialize model: {exc}") from exc

    # Build the prompt with image generation parameters
    prompt_parts = [payload.prompt]
    
    # Add generation parameters as text hints
    config_hints = []
    if payload.negative_prompt:
        config_hints.append(f"Avoid: {payload.negative_prompt}")
    if payload.aspect_ratio and payload.aspect_ratio != "auto":
        config_hints.append(f"Aspect ratio: {payload.aspect_ratio}")
    if payload.width and payload.height:
        config_hints.append(f"Size: {payload.width}x{payload.height}")
    
    if config_hints:
        prompt_parts.append("\n\nGeneration settings:\n" + "\n".join(config_hints))
    
    full_prompt = "\n".join(prompt_parts)
    
    print(f"🎨 Generating with model: {model_name}")
    print(f"📝 Prompt: {full_prompt[:100]}...")
    
    # Generate configuration
    generation_config = {}
    if payload.seed is not None:
        generation_config["seed"] = payload.seed
    if payload.temperature is not None:
        generation_config["temperature"] = payload.temperature
    
    try:
        # Generate the images
        response = model.generate_content(
            full_prompt,
            generation_config=generation_config if generation_config else None
        )
        
        # Extract images from response
        images: List[ImagePayload] = []
        
        # Check if response contains image data
        if hasattr(response, 'parts'):
            for part in response.parts:
                if hasattr(part, 'inline_data'):
                    mime_type = part.inline_data.mime_type
                    image_data = part.inline_data.data
                    
                    if isinstance(image_data, bytes):
                        image_b64 = base64.b64encode(image_data).decode("ascii")
                    else:
                        image_b64 = image_data
                    
                    images.append(
                        ImagePayload(
                            mime_type=mime_type,
                            b64_data=image_b64,
                        )
                    )
        
        if not images:
            print(f"⚠️ No images found in response. Response type: {type(response)}")
            raise HTTPException(status_code=502, detail="Model did not return image content. Try using Gemini model instead.")
        
        print(f"✅ Generated {len(images)} image(s)")
        return GenerateResponse(model=model_name, images=images)
        
    except Exception as exc:
        print(f"❌ Image generation failed: {exc}")
        raise HTTPException(status_code=502, detail=f"Image generation failed: {exc}. Try using Gemini model instead.") from exc


@app.post("/edit/gemini", response_model=EditResponse)
async def edit_with_gemini(payload: EditRequest) -> EditResponse:
    model = genai.GenerativeModel(model_name=GEMINI_FLASH_MODEL)

    instruction = payload.instruction.strip()
    if not instruction:
        raise HTTPException(status_code=400, detail="Instruction cannot be empty")

    prompt_text = (
        "MASKED REGION EDITING - Follow these instructions precisely:\n\n"
        "IMAGE 1: Original image to edit\n"
        "IMAGE 2 (optional): Binary mask - WHITE pixels show WHERE to apply changes,"
        " BLACK pixels show what to preserve\n\n"
        f"YOUR TASK: {instruction}\n\n"
        "CRITICAL MASK RULES:\n"
        "1. Apply changes ONLY in white mask areas\n"
        "2. Keep black mask areas unchanged\n"
        "3. Blend changes seamlessly at boundaries\n"
        "4. Match original lighting, colors, and textures\n"
    ) if payload.mask_image else (
        f"Edit this image according to the following instruction: {instruction}\n\n"
        "Maintain the original image's lighting, perspective, and overall composition."
        " Make the changes look natural and seamlessly integrated."
    )

    parts: List[Dict[str, Any]] = [{"text": prompt_text}]

    try:
        parts.append(
            {
                "inline_data": {
                    "mime_type": "image/png",
                    "data": _normalize_base64(payload.original_image),
                }
            }
        )
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Invalid original image: {exc}") from exc

    if payload.mask_image:
        try:
            parts.append(
                {
                    "inline_data": {
                        "mime_type": "image/png",
                        "data": _normalize_base64(payload.mask_image),
                    }
                }
            )
        except Exception as exc:
            raise HTTPException(status_code=400, detail=f"Invalid mask image: {exc}") from exc

    for ref_image in payload.reference_images or []:
        try:
            parts.append(
                {
                    "inline_data": {
                        "mime_type": "image/png",
                        "data": _normalize_base64(ref_image),
                    }
                }
            )
        except Exception as exc:
            raise HTTPException(status_code=400, detail=f"Invalid reference image: {exc}") from exc

    args = _build_generation_args(
        temperature=payload.temperature,
        seed=payload.seed,
    )

    try:
        result = model.generate_content([
            {
                "role": "user",
                "parts": parts,
            }
        ], **args)
    except Exception as exc:  # pragma: no cover
        raise HTTPException(status_code=502, detail=f"Gemini edit failed: {exc}") from exc

    images: List[ImagePayload] = []
    for candidate in getattr(result, "candidates", []) or []:
        content = getattr(candidate, "content", None)
        if not content:
            continue
        for part in getattr(content, "parts", []) or []:
            inline = getattr(part, "inline_data", None)
            if inline and getattr(inline, "data", None):
                raw_data = inline.data if isinstance(inline.data, bytes) else bytes(inline.data)
                images.append(_serialize_inline_image(raw_data, getattr(inline, "mime_type", "image/png")))

    if not images:
        raise HTTPException(status_code=502, detail="Gemini did not return edited image content")

    return EditResponse(model=GEMINI_FLASH_MODEL, images=images)


@app.get("/models/imagen")
async def list_imagen_models() -> dict[str, List[str]]:
    """List available image generation models.

    Note: True Imagen models require Vertex AI setup. For now, we return
    Gemini models that support image generation through the Gemini API.
    """
    try:
        # Return Gemini models that support image generation
        # Imagen models require Vertex AI and different API setup
        models = [
            "models/gemini-2.0-flash-exp",
            "models/gemini-exp-1206", 
            GEMINI_FLASH_MODEL,
        ]
        return {"models": models}
    except Exception as exc:  # pragma: no cover
        # Fallback to default model if listing fails
        return {"models": [GEMINI_FLASH_MODEL]}


@app.post("/upscale", response_model=UpscaleResponse)
async def upscale_image(payload: UpscaleRequest) -> UpscaleResponse:
    """Upscale an image using Google Imagen AI model."""
    
    # Normalize scale factor to supported values (2 or 4)
    scale_factor = 4 if payload.scale >= 4 else 2
    
    try:
        # Decode the input image
        image_bytes = _normalize_base64(payload.image)
        
        # Validate image format and size
        try:
            with Image.open(BytesIO(image_bytes)) as img:
                # Check if image is too large (Imagen has limits)
                if img.width > 2048 or img.height > 2048:
                    raise HTTPException(
                        status_code=400, 
                        detail=f"Image too large ({img.width}x{img.height}). Maximum size is 2048x2048 pixels."
                    )
                
                original_size = f"{img.width}x{img.height}"
                
        except Exception as exc:
            raise HTTPException(status_code=400, detail=f"Invalid image format: {exc}") from exc
        
        # Use Google Imagen for real upscaling
        upscaled_bytes = _upscale_with_google_imagen(image_bytes, scale_factor)
        
        # Get new dimensions for logging
        try:
            with Image.open(BytesIO(upscaled_bytes)) as upscaled_img:
                new_size = f"{upscaled_img.width}x{upscaled_img.height}"
        except:
            new_size = "unknown"
        
        # Log the successful upscaling
        print(f"Successfully upscaled image from {original_size} to {new_size} (scale: {scale_factor}x)")
        
        upscaled_image = _serialize_inline_image(upscaled_bytes)
        
        return UpscaleResponse(
            model="google-imagen-upscale",
            scale=scale_factor,
            image=upscaled_image,
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as exc:
        # Handle any other unexpected errors
        raise HTTPException(status_code=500, detail=f"Upscaling failed: {str(exc)}") from exc


@app.post("/inpaint", response_model=InpaintResponse)
async def inpaint_image(payload: InpaintRequest) -> InpaintResponse:
    """Insert objects into an image using Google Imagen inpainting."""
    
    try:
        # Decode the input image
        image_bytes = _normalize_base64(payload.image)
        
        # Validate image format and size
        try:
            with Image.open(BytesIO(image_bytes)) as img:
                # Check if image is too large (Imagen has limits)
                if img.width > 2048 or img.height > 2048:
                    raise HTTPException(
                        status_code=400, 
                        detail=f"Image too large ({img.width}x{img.height}). Maximum size is 2048x2048 pixels."
                    )
                
                original_size = f"{img.width}x{img.height}"
                
        except Exception as exc:
            raise HTTPException(status_code=400, detail=f"Invalid image format: {exc}") from exc
        
        # Handle mask image if provided
        mask_image_bytes = None
        if payload.mask_image:
            try:
                mask_image_bytes = _normalize_base64(payload.mask_image)
                # Validate mask image
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
        
        # Validate mask mode and parameters
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
        
        # For user-provided masks, require mask image
        if payload.mask_mode == "MASK_MODE_USER_PROVIDED" and not mask_image_bytes:
            raise HTTPException(
                status_code=400,
                detail="mask_image is required when mask_mode is MASK_MODE_USER_PROVIDED"
            )
        
        # For semantic masks, require mask classes
        if payload.mask_mode == "MASK_MODE_SEMANTIC" and not payload.mask_classes:
            raise HTTPException(
                status_code=400,
                detail="mask_classes is required when mask_mode is MASK_MODE_SEMANTIC"
            )
        
        # Use Google Imagen for inpainting
        print(f"Starting inpainting: {original_size}, prompt: '{payload.prompt[:50]}...', mode: {payload.mask_mode}")
        
        edited_images_bytes = _inpaint_with_google_imagen(
            image_data=image_bytes,
            prompt=payload.prompt,
            mask_image_data=mask_image_bytes,
            mask_mode=payload.mask_mode,
            mask_classes=payload.mask_classes,
            mask_dilation=payload.mask_dilation,
            edit_steps=payload.edit_steps,
            sample_count=payload.sample_count
        )
        
        # Convert to response format
        images = []
        for i, img_bytes in enumerate(edited_images_bytes):
            images.append(_serialize_inline_image(img_bytes))
            print(f"Generated image {i+1}/{len(edited_images_bytes)}: {len(img_bytes)} bytes")
        
        print(f"✓ Inpainting completed: {len(images)} image(s) generated")
        
        return InpaintResponse(
            model="google-imagen-3.0-inpaint",
            images=images,
            edit_steps=payload.edit_steps,
            sample_count=len(images)
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as exc:
        # Handle any other unexpected errors
        raise HTTPException(status_code=500, detail=f"Inpainting failed: {str(exc)}") from exc


@app.post("/prompt/improve", response_model=ImprovePromptResponse)
async def improve_prompt(payload: ImprovePromptRequest) -> ImprovePromptResponse:
    model = genai.GenerativeModel(model_name=GEMINI_FLASH_MODEL)

    instruction_text = (
        "Improve the following image generation prompt by making it more descriptive, "
        "cinematic, and specific while preserving any placeholders like [subject]. "
        "Return only the improved prompt text without extra commentary.\n\n"
        f"Original Prompt:\n{payload.prompt}"
    )

    if payload.language.lower() == "zh":
        instruction_text = (
            "改进以下图像生成提示词，使其更具描述性、更有电影感和更具体，同时保留任何占位符（如 [主题]）。"
            "只返回改进后的提示词文本，不要添加额外的评论。\n\n"
            f"原始提示词:\n{payload.prompt}"
        )

    try:
        response = model.generate_content([
            {
                "role": "user",
                "parts": [{"text": instruction_text}],
            }
        ])
    except Exception as exc:  # pragma: no cover
        raise HTTPException(status_code=502, detail=f"Prompt improvement failed: {exc}") from exc

    for candidate in getattr(response, "candidates", []) or []:
        for part in getattr(getattr(candidate, "content", None), "parts", []) or []:
            text_value = getattr(part, "text", "")
            if text_value:
                return ImprovePromptResponse(prompt=text_value.strip())

    raise HTTPException(status_code=502, detail="Prompt improvement did not return any text")


@app.post("/segment/gemini")
async def segment_image(payload: SegmentationRequest) -> Dict[str, Any]:
    model = genai.GenerativeModel(model_name=GEMINI_FLASH_MODEL)

    instruction = (
        "Analyze this image and create a segmentation mask for:"
        f" {payload.query}\n\n"
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
                            "data": _normalize_base64(payload.image),
                        }
                    },
                ],
            }
        ])
    except Exception as exc:  # pragma: no cover
        raise HTTPException(status_code=502, detail=f"Segmentation failed: {exc}") from exc

    for candidate in getattr(response, "candidates", []) or []:
        for part in getattr(getattr(candidate, "content", None), "parts", []) or []:
            text_value = getattr(part, "text", "")
            if text_value:
                try:
                    return json.loads(text_value)
                except json.JSONDecodeError as exc:  # pragma: no cover
                    raise HTTPException(status_code=502, detail=f"Invalid segmentation JSON: {exc}") from exc

    raise HTTPException(status_code=502, detail="Segmentation did not return any data")


@app.post("/auth/login", response_model=LoginResponse)
async def login(credentials: LoginRequest) -> LoginResponse:
    username = credentials.username.strip()
    password = credentials.password.strip()

    valid_usernames = {AUTH_USERNAME, f"{AUTH_USERNAME}@example.com"}

    if username.lower() in {name.lower() for name in valid_usernames} and password == AUTH_PASSWORD:
        return LoginResponse(access_token="static-admin-token", username=AUTH_USERNAME)

    raise HTTPException(status_code=401, detail="Invalid username or password")


# OAuth2 scopes required for Vertex AI
VERTEX_AI_SCOPES = [
    'https://www.googleapis.com/auth/cloud-platform',
    'https://www.googleapis.com/auth/generative-language.tuning',
]


@app.get("/auth/vertex/url", response_model=OAuthUrlResponse)
async def get_vertex_auth_url() -> OAuthUrlResponse:
    """
    Generate OAuth2 authorization URL for Vertex AI authentication.
    
    This endpoint returns a URL that users can visit to authorize
    access to Google Cloud Vertex AI APIs.
    """
    credentials_path = GOOGLE_APPLICATION_CREDENTIALS
    
    # Make path absolute if relative
    if not os.path.isabs(credentials_path):
        credentials_path = os.path.join(os.path.dirname(__file__), credentials_path)
    
    if not os.path.exists(credentials_path):
        raise HTTPException(
            status_code=500,
            detail=f"OAuth2 credentials file not found: {credentials_path}. "
                   "Please download OAuth2 credentials from Google Cloud Console and save as credentials.json"
        )
    
    try:
        # Create OAuth2 flow
        flow = Flow.from_client_secrets_file(
            credentials_path,
            scopes=VERTEX_AI_SCOPES,
            redirect_uri='http://localhost:8080'
        )
        
        # Generate authorization URL
        auth_url, state = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true',
            prompt='consent'
        )
        
        return OAuthUrlResponse(
            auth_url=auth_url,
            message="Visit this URL to authorize access to Vertex AI"
        )
        
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate authorization URL: {str(exc)}"
        ) from exc


@app.post("/auth/vertex/callback", response_model=OAuthTokenResponse)
async def handle_vertex_callback(callback_data: OAuthCallbackRequest) -> OAuthTokenResponse:
    """
    Handle OAuth2 callback and save access token.
    
    After user authorizes, call this endpoint with the authorization code
    to complete the OAuth flow and save the token.
    """
    credentials_path = GOOGLE_APPLICATION_CREDENTIALS
    
    if not os.path.isabs(credentials_path):
        credentials_path = os.path.join(os.path.dirname(__file__), credentials_path)
    
    if not os.path.exists(credentials_path):
        raise HTTPException(
            status_code=500,
            detail="OAuth2 credentials file not found"
        )
    
    try:
        # Create OAuth2 flow
        flow = Flow.from_client_secrets_file(
            credentials_path,
            scopes=VERTEX_AI_SCOPES,
            redirect_uri='http://localhost:8080'
        )
        
        # Exchange authorization code for tokens
        flow.fetch_token(code=callback_data.code)
        
        # Get credentials
        creds = flow.credentials
        
        # Save token to file
        token_path = "token.json"
        with open(token_path, 'w') as token_file:
            token_file.write(creds.to_json())
        
        return OAuthTokenResponse(
            success=True,
            message=f"Successfully authenticated! Token saved to {token_path}",
            token_valid=creds.valid
        )
        
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to exchange authorization code: {str(exc)}"
        ) from exc


@app.get("/auth/vertex/status")
async def check_vertex_auth_status() -> Dict[str, Any]:
    """
    Check if Vertex AI authentication is configured and valid.
    """
    token_path = "token.json"
    
    status = {
        "authenticated": False,
        "token_exists": os.path.exists(token_path),
        "token_valid": False,
        "credentials_exists": os.path.exists(GOOGLE_APPLICATION_CREDENTIALS),
        "project_id": GOOGLE_CLOUD_PROJECT_ID,
        "location": GOOGLE_CLOUD_LOCATION,
    }
    
    if status["token_exists"]:
        try:
            creds = Credentials.from_authorized_user_file(token_path, VERTEX_AI_SCOPES)
            
            if creds and creds.valid:
                status["authenticated"] = True
                status["token_valid"] = True
                if creds.expiry:
                    status["token_expiry"] = creds.expiry.isoformat()
            elif creds and creds.expired and creds.refresh_token:
                # Try to refresh
                creds.refresh(Request())
                status["authenticated"] = True
                status["token_valid"] = True
                status["token_refreshed"] = True
                
                # Save refreshed token
                with open(token_path, 'w') as token_file:
                    token_file.write(creds.to_json())
            else:
                status["message"] = "Token expired or invalid"
        except Exception as e:
            status["error"] = str(e)
    else:
        status["message"] = "No authentication token found. Please authenticate using /auth/vertex/url"
    
    return status
