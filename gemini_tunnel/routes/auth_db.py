"""Authentication routes with database integration."""

from typing import Any, Dict, Optional
from fastapi import APIRouter, HTTPException, Depends, Request, status
from fastapi.security import HTTPBearer

from models_auth import (
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    RefreshTokenRequest,
    UserResponse,
    ApiKeyCreate,
    ApiKeyResponse,
    ApiKeyListResponse,
    SessionResponse,
    OAuthUrlResponse,
    OAuthCallbackRequest,
    OAuthTokenResponse
)
from services.auth_service_db import (
    authenticate_user,
    create_access_token,
    create_refresh_token,
    get_current_user,
    create_session,
    hash_password,
    create_api_key,
    log_audit
)
from database import get_table
from tinydb import Query
from datetime import datetime, timedelta

router = APIRouter(prefix="/auth", tags=["authentication"])
security = HTTPBearer()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(request: Request, user_data: RegisterRequest) -> UserResponse:
    """Register a new user."""
    # Check if user already exists
    existing_user = await db.user.find_first(
        where={
            "OR": [
                {"email": user_data.email},
                {"username": user_data.username}
            ]
        }
    )
    
    if existing_user:
        if existing_user.email == user_data.email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )
    
    # Create new user
    password_hash = hash_password(user_data.password)
    
    user = await db.user.create(
        data={
            "email": user_data.email,
            "username": user_data.username,
            "password_hash": password_hash,
            "full_name": user_data.full_name,
            "is_active": True,
            "is_admin": False,
            "is_superuser": False
        }
    )
    
    # Log registration
    await log_audit(
        action="user_registered",
        user_id=user.id,
        details={"email": user.email, "username": user.username},
        ip_address=request.client.host if request.client else None
    )
    
    return UserResponse.model_validate(user)


@router.post("/login", response_model=TokenResponse)
async def login(request: Request, credentials: LoginRequest) -> TokenResponse:
    """Login with username/email and password."""
    user = await authenticate_user(credentials.username, credentials.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create tokens
    access_token = create_access_token(data={"sub": user.id})
    refresh_token = create_refresh_token(data={"sub": user.id})
    
    # Create session
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    await create_session(user.id, ip_address, user_agent)
    
    # Log login
    await log_audit(
        action="user_login",
        user_id=user.id,
        ip_address=ip_address
    )
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=30 * 60,  # 30 minutes
        user=UserResponse.model_validate(user)
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(token_request: RefreshTokenRequest):
    """Refresh access token using refresh token."""
    from jose import JWTError, jwt
    from services.auth_service_db import SECRET_KEY, ALGORITHM
    
    try:
        payload = jwt.decode(token_request.refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        token_type: str = payload.get("type")
        
        if user_id is None or token_type != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    user = await db.user.find_unique(where={"id": user_id})
    
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )
    
    # Create new tokens
    access_token = create_access_token(data={"sub": user.id})
    refresh_token = create_refresh_token(data={"sub": user.id})
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=30 * 60,
        user=UserResponse.model_validate(user)
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user=Depends(get_current_user)) -> UserResponse:
    """Get current user information."""
    return UserResponse.model_validate(current_user)


@router.get("/sessions", response_model=list[SessionResponse])
async def get_my_sessions(current_user=Depends(get_current_user)):
    """Get all active sessions for current user."""
    sessions = await db.session.find_many(
        where={
            "user_id": current_user.id,
            "expires_at": {"gt": datetime.utcnow()}
        },
        order={"last_activity": "desc"}
    )
    
    return [SessionResponse.model_validate(s) for s in sessions]


@router.delete("/sessions/{session_id}")
async def revoke_session(session_id: str, current_user=Depends(get_current_user)):
    """Revoke a specific session."""
    session = await db.session.find_first(
        where={"id": session_id, "user_id": current_user.id}
    )
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    await db.session.delete(where={"id": session_id})
    
    await log_audit(
        action="session_revoked",
        user_id=current_user.id,
        resource=f"session:{session_id}"
    )
    
    return {"message": "Session revoked successfully"}


@router.post("/api-keys", response_model=ApiKeyResponse)
async def create_user_api_key(
    key_data: ApiKeyCreate,
    current_user=Depends(get_current_user)
) -> ApiKeyResponse:
    """Create a new API key for current user."""
    key, key_info = await create_api_key(
        user_id=current_user.id,
        name=key_data.name,
        expires_days=key_data.expires_days
    )
    
    await log_audit(
        action="api_key_created",
        user_id=current_user.id,
        resource=f"api_key:{key_info['id']}"
    )
    
    return ApiKeyResponse(key=key, **key_info)


@router.get("/api-keys", response_model=ApiKeyListResponse)
async def list_my_api_keys(current_user=Depends(get_current_user)):
    """List all API keys for current user."""
    api_keys = await db.apikey.find_many(
        where={"user_id": current_user.id},
        order={"created_at": "desc"}
    )
    
    return ApiKeyListResponse(
        api_keys=[ApiKeyResponse.model_validate(k) for k in api_keys],
        total=len(api_keys)
    )


@router.delete("/api-keys/{key_id}")
async def revoke_api_key(key_id: str, current_user=Depends(get_current_user)):
    """Revoke an API key."""
    api_key = await db.apikey.find_first(
        where={"id": key_id, "user_id": current_user.id}
    )
    
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API key not found"
        )
    
    await db.apikey.update(
        where={"id": key_id},
        data={"is_active": False}
    )
    
    await log_audit(
        action="api_key_revoked",
        user_id=current_user.id,
        resource=f"api_key:{key_id}"
    )
    
    return {"message": "API key revoked successfully"}


# Vertex AI OAuth routes (unchanged)
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
