"""
AI POD API

A FastAPI application that provides endpoints for AI-powered image generation,
editing, upscaling, and inpainting using Google Gemini and Imagen models.
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import ALLOW_ALL_ORIGINS, ALLOWED_ORIGINS
from database import connect_db, disconnect_db
from routes import (
    auth_router, 
    generation_router, 
    editing_router, 
    upscale_router
)
from routes.auth_db import router as auth_db_router
from routes.admin import router as admin_router

# Configure logging
logger = logging.getLogger(__name__)
if not logger.handlers:
    logging.basicConfig(level=logging.INFO)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifespan events."""
    # Startup
    logger.info("🚀 Starting AI POD API...")
    await connect_db()
    logger.info("✅ Database connected")
    
    yield
    
    # Shutdown
    logger.info("👋 Shutting down AI POD API...")
    await disconnect_db()
    logger.info("✅ Database disconnected")


# Initialize FastAPI app
app = FastAPI(
    title="AI POD API", 
    version="0.1.0",
    description="AI-powered image generation and editing API using Google Gemini and Imagen",
    lifespan=lifespan
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
app.include_router(auth_router, prefix="/api/v1/auth/legacy", tags=["Legacy Auth"])
app.include_router(auth_db_router, prefix="/api/v1", tags=["Authentication"])
app.include_router(admin_router, prefix="/api/v1", tags=["Admin"])
app.include_router(generation_router, tags=["Image Generation"])
app.include_router(editing_router, tags=["Image Editing"])
app.include_router(upscale_router, tags=["Image Enhancement"])


@app.get("/health")
async def health_check() -> dict[str, str]:
    """Health check endpoint."""
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
