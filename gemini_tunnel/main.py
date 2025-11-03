import base64
import json
import os
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

import google.generativeai as genai

load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    raise RuntimeError("GEMINI_API_KEY environment variable is missing")

GEMINI_FLASH_MODEL = os.getenv("GEMINI_FLASH_MODEL", "models/gemini-2.5-flash-image")
IMAGEN_MODEL = os.getenv("IMAGEN_MODEL", "imagen-3.0-002")
AUTH_USERNAME = os.getenv("AUTH_USERNAME", "admin")
AUTH_PASSWORD = os.getenv("AUTH_PASSWORD", "admin")

raw_origins = os.getenv("ALLOWED_ORIGINS", "*")
allowed_origins = [origin.strip() for origin in raw_origins.split(",") if origin.strip()]
if not allowed_origins:
    allowed_origins = ["*"]

# Configure the Gemini client once so requests reuse the same credentials.
genai.configure(api_key=API_KEY)

app = FastAPI(title="Gemini Image Tunnel", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if allowed_origins == ["*"] else allowed_origins,
    allow_credentials=True,
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


class LoginRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=64)
    password: str = Field(..., min_length=3, max_length=128)


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    username: str


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
    model_name = (payload.model or IMAGEN_MODEL).strip() or IMAGEN_MODEL
    model = genai.ImageGenerationModel(model_name=model_name)

    kwargs: Dict[str, Any] = {
        "prompt": payload.prompt,
        "number_of_images": payload.num_images,
    }
    if payload.negative_prompt:
        kwargs["negative_prompt"] = payload.negative_prompt
    if payload.aspect_ratio:
        kwargs["aspect_ratio"] = payload.aspect_ratio
    if payload.width and payload.height:
        kwargs["image_size"] = {"width": payload.width, "height": payload.height}
    if payload.seed is not None:
        kwargs["seed"] = payload.seed
    if payload.temperature is not None:
        kwargs["temperature"] = payload.temperature

    try:
        result = model.generate_images(**kwargs)
    except Exception as exc:  # pragma: no cover
        raise HTTPException(status_code=502, detail=f"Imagen request failed: {exc}") from exc

    images: List[ImagePayload] = []
    for image in getattr(result, "images", []) or []:
        image_b64 = getattr(image, "image_base64", None)
        if not image_b64:
            continue
        if isinstance(image_b64, bytes):
            image_b64 = base64.b64encode(image_b64).decode("ascii")
        images.append(
            ImagePayload(
                mime_type=getattr(image, "mime_type", "image/png"),
                b64_data=image_b64,
            )
        )

    if not images:
        raise HTTPException(status_code=502, detail="Imagen did not return image content")

    return GenerateResponse(model=model_name, images=images)


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
    try:
        models = [
            model.name
            for model in genai.list_models()
            if "generateImage" in getattr(model, "supported_generation_methods", [])
        ]
    except Exception as exc:  # pragma: no cover
        raise HTTPException(status_code=502, detail=f"Failed to list models: {exc}") from exc

    return {"models": models}


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
