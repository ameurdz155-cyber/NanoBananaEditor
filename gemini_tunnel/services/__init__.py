"""Services package initialization."""

from services.auth_service import (
    get_google_cloud_access_token,
    validate_login,
    get_vertex_auth_url,
    handle_vertex_callback,
    check_vertex_auth_status
)
from services.gemini_service import (
    generate_images,
    edit_image,
    improve_prompt,
    segment_image,
    list_models
)
from services.imagen_service import (
    upscale_with_google_imagen,
    inpaint_with_google_imagen
)

__all__ = [
    # Auth
    'get_google_cloud_access_token',
    'validate_login',
    'get_vertex_auth_url',
    'handle_vertex_callback',
    'check_vertex_auth_status',
    # Gemini
    'generate_images',
    'edit_image',
    'improve_prompt',
    'segment_image',
    'list_models',
    # Imagen
    'upscale_with_google_imagen',
    'inpaint_with_google_imagen',
]
