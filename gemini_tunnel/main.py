import base64
import os
from typing import List, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

import google.generativeai as genai

load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    raise RuntimeError("GEMINI_API_KEY environment variable is missing")

GEMINI_FLASH_MODEL = os.getenv("GEMINI_FLASH_MODEL", "gemini-2.5-flash")
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


class ImageRequest(BaseModel):
    prompt: str = Field(..., min_length=4, max_length=2000)
    negative_prompt: Optional[str] = Field(default=None, max_length=2000)
    num_images: int = Field(default=1, ge=1, le=4)


class ImagenRequest(ImageRequest):
    model: Optional[str] = Field(
        default=None,
        description="Overrides default Imagen model when provided",
        min_length=1,
        max_length=128,
    )


class ImagePayload(BaseModel):
    mime_type: str
    b64_data: str


class GenerateResponse(BaseModel):
    model: str
    images: List[ImagePayload]


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
    model = genai.GenerativeModel(model_name=GEMINI_FLASH_MODEL)

    prompt_text = payload.prompt
    if payload.negative_prompt:
        prompt_text = f"{prompt_text}\nDo not include: {payload.negative_prompt}"

    try:
        result = model.generate_content(
            [
                {
                    "role": "user",
                    "parts": [
                        {"text": "You are an image generator. Reply with image data."},
                        {"text": prompt_text},
                    ],
                }
            ]
        )
    except Exception as exc:  # pragma: no cover
        raise HTTPException(status_code=502, detail=f"Gemini request failed: {exc}") from exc

    images: List[ImagePayload] = []
    for candidate in getattr(result, "candidates", []) or []:
        content = getattr(candidate, "content", None)
        if not content:
            continue
        for part in getattr(content, "parts", []) or []:
            inline = getattr(part, "inline_data", None)
            if inline and getattr(inline, "data", None):
                raw_data = inline.data
                if isinstance(raw_data, bytes):
                    b64_data = base64.b64encode(raw_data).decode("ascii")
                else:
                    b64_data = str(raw_data)
                images.append(
                    ImagePayload(
                        mime_type=getattr(inline, "mime_type", "image/png"),
                        b64_data=b64_data,
                    )
                )
            if len(images) >= payload.num_images:
                break
        if len(images) >= payload.num_images:
            break

    if not images:
        raise HTTPException(status_code=502, detail="Gemini did not return image content")

    return GenerateResponse(model=GEMINI_FLASH_MODEL, images=images)


@app.post("/generate/imagen", response_model=GenerateResponse)
async def generate_with_imagen(payload: ImagenRequest) -> GenerateResponse:
    model_name = (payload.model or IMAGEN_MODEL).strip() or IMAGEN_MODEL
    model = genai.ImageGenerationModel(model_name=model_name)

    kwargs = {
        "prompt": payload.prompt,
        "number_of_images": payload.num_images,
    }
    if payload.negative_prompt:
        kwargs["negative_prompt"] = payload.negative_prompt

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


@app.post("/auth/login", response_model=LoginResponse)
async def login(credentials: LoginRequest) -> LoginResponse:
    username = credentials.username.strip()
    password = credentials.password.strip()

    valid_usernames = {AUTH_USERNAME, f"{AUTH_USERNAME}@example.com"}

    if username.lower() in {name.lower() for name in valid_usernames} and password == AUTH_PASSWORD:
        return LoginResponse(access_token="static-admin-token", username=AUTH_USERNAME)

    raise HTTPException(status_code=401, detail="Invalid username or password")
