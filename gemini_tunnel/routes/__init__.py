"""Routes package initialization."""

from routes.auth import router as auth_router
from routes.generation import router as generation_router
from routes.editing import router as editing_router
from routes.upscale import router as upscale_router

__all__ = [
    'auth_router',
    'generation_router',
    'editing_router',
    'upscale_router',
]
