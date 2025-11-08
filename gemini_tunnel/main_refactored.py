"""
AI POD API

A FastAPI application that provides endpoints for AI-powered image generation,
editing, upscaling, and inpainting using Google Gemini and Imagen models.
"""

import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import ALLOW_ALL_ORIGINS, ALLOWED_ORIGINS
from routes import auth_router, generation_router, editing_router, upscale_router

# Configure logging
logger = logging.getLogger(__name__)
if not logger.handlers:
    logging.basicConfig(level=logging.INFO)

# Initialize FastAPI app
app = FastAPI(
    title="AI POD API", 
    version="0.1.0",
    description="AI-powered image generation and editing API using Google Gemini and Imagen"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if ALLOW_ALL_ORIGINS else ALLOWED_ORIGINS,
    allow_credentials=not ALLOW_ALL_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

# Register routers
app.include_router(auth_router)
app.include_router(generation_router)
app.include_router(editing_router)
app.include_router(upscale_router)


@app.get("/health")
async def health_check() -> dict[str, str]:
    """Health check endpoint."""
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
