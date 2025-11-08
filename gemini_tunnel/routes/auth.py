"""Authentication routes."""

from typing import Any, Dict
from fastapi import APIRouter, HTTPException

from models import (
    LoginRequest, 
    LoginResponse, 
    OAuthUrlResponse, 
    OAuthCallbackRequest, 
    OAuthTokenResponse
)
from services.auth_service import (
    validate_login,
    get_vertex_auth_url,
    handle_vertex_callback,
    check_vertex_auth_status
)
from config import AUTH_USERNAME

router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post("/login", response_model=LoginResponse)
async def login(credentials: LoginRequest) -> LoginResponse:
    """Authenticate user with username and password."""
    username = credentials.username.strip()
    password = credentials.password.strip()

    if validate_login(username, password):
        return LoginResponse(access_token="static-admin-token", username=AUTH_USERNAME)

    raise HTTPException(status_code=401, detail="Invalid username or password")


@router.get("/vertex/url", response_model=OAuthUrlResponse)
async def get_vertex_auth_url_route() -> OAuthUrlResponse:
    """Generate OAuth2 authorization URL for Vertex AI authentication."""
    auth_url, message = get_vertex_auth_url()
    return OAuthUrlResponse(auth_url=auth_url, message=message)


@router.post("/vertex/callback", response_model=OAuthTokenResponse)
async def handle_vertex_callback_route(callback_data: OAuthCallbackRequest) -> OAuthTokenResponse:
    """Handle OAuth2 callback and save access token."""
    result = handle_vertex_callback(callback_data.code, callback_data.state)
    return OAuthTokenResponse(**result)


@router.get("/vertex/status")
async def check_vertex_auth_status_route() -> Dict[str, Any]:
    """Check if Vertex AI authentication is configured and valid."""
    return check_vertex_auth_status()
