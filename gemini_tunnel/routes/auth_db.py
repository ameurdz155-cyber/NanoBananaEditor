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
    import uuid
    from datetime import datetime
    
    users_table = get_table("users")
    User = Query()
    
    # Check if user already exists
    existing_users = users_table.search(
        (User.email == user_data.email) | (User.username == user_data.username)
    )
    
    if existing_users:
        existing = existing_users[0]
        if existing.get("email") == user_data.email:
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
    now = datetime.utcnow()
    
    user = {
        "id": str(uuid.uuid4()),
        "email": user_data.email,
        "username": user_data.username,
        "password_hash": password_hash,
        "full_name": user_data.full_name,
        "is_active": True,
        "is_admin": False,
        "is_superuser": False,
        "created_at": now.isoformat(),
        "updated_at": now.isoformat(),
        "last_login": None
    }
    
    users_table.insert(user)
    
    # Log registration
    import json
    await log_audit(
        action="user_registered",
        user_id=user["id"],
        details=json.dumps({"email": user["email"], "username": user["username"]}),
        ip_address=request.client.host if request.client else None
    )
    
    # Convert to response model
    user_response = user.copy()
    user_response["created_at"] = now
    user_response["last_login"] = None
    
    return UserResponse(**user_response)


@router.post("/login", response_model=TokenResponse)
async def login(request: Request, credentials: LoginRequest) -> TokenResponse:
    """Login with username/email and password."""
    from datetime import datetime
    
    user = await authenticate_user(credentials.username, credentials.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create tokens
    access_token = create_access_token(data={"sub": user["id"]})
    refresh_token = create_refresh_token(data={"sub": user["id"]})
    
    # Create session
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    await create_session(user["id"], ip_address, user_agent)
    
    # Log login
    await log_audit(
        action="user_login",
        user_id=user["id"],
        ip_address=ip_address
    )
    
    # Convert to response model
    user_response = user.copy()
    user_response["created_at"] = datetime.fromisoformat(user["created_at"])
    user_response["last_login"] = datetime.fromisoformat(user["last_login"]) if user.get("last_login") else None
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=30 * 60,  # 30 minutes
        user=UserResponse(**user_response)
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(token_request: RefreshTokenRequest):
    """Refresh access token using refresh token."""
    from jose import JWTError, jwt
    from services.auth_service_db import SECRET_KEY, ALGORITHM
    from datetime import datetime
    
    users_table = get_table("users")
    User = Query()
    
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
    
    users = users_table.search(User.id == user_id)
    
    if not users or not users[0].get("is_active"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )
    
    user = users[0]
    
    # Create new tokens
    access_token = create_access_token(data={"sub": user["id"]})
    refresh_token = create_refresh_token(data={"sub": user["id"]})
    
    # Convert to response model
    user_response = user.copy()
    user_response["created_at"] = datetime.fromisoformat(user["created_at"])
    user_response["last_login"] = datetime.fromisoformat(user["last_login"]) if user.get("last_login") else None
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=30 * 60,
        user=UserResponse(**user_response)
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user=Depends(get_current_user)) -> UserResponse:
    """Get current user information."""
    from datetime import datetime
    
    user_response = current_user.copy()
    user_response["created_at"] = datetime.fromisoformat(current_user["created_at"])
    user_response["last_login"] = datetime.fromisoformat(current_user["last_login"]) if current_user.get("last_login") else None
    
    return UserResponse(**user_response)


@router.get("/sessions", response_model=list[SessionResponse])
async def get_my_sessions(current_user=Depends(get_current_user)):
    """Get all active sessions for current user."""
    from datetime import datetime
    
    sessions_table = get_table("sessions")
    Session = Query()
    
    sessions = sessions_table.search(
        (Session.user_id == current_user["id"]) &
        (Session.expires_at > datetime.utcnow().isoformat())
    )
    
    # Sort by last_activity descending
    sessions.sort(key=lambda s: s.get("last_activity", ""), reverse=True)
    
    result = []
    for s in sessions:
        result.append(SessionResponse(
            id=s["id"],
            ip_address=s.get("ip_address"),
            user_agent=s.get("user_agent"),
            created_at=datetime.fromisoformat(s["created_at"]),
            last_activity=datetime.fromisoformat(s["last_activity"]),
            expires_at=datetime.fromisoformat(s["expires_at"])
        ))
    
    return result


@router.delete("/sessions/{session_id}")
async def revoke_session(session_id: str, current_user=Depends(get_current_user)):
    """Revoke a specific session."""
    sessions_table = get_table("sessions")
    Session = Query()
    
    sessions = sessions_table.search(
        (Session.id == session_id) & (Session.user_id == current_user["id"])
    )
    
    if not sessions:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    sessions_table.remove(Session.id == session_id)
    
    await log_audit(
        action="session_revoked",
        user_id=current_user["id"],
        resource=f"session:{session_id}"
    )
    
    return {"message": "Session revoked successfully"}


@router.post("/api-keys", response_model=ApiKeyResponse)
async def create_user_api_key(
    key_data: ApiKeyCreate,
    current_user=Depends(get_current_user)
) -> ApiKeyResponse:
    """Create a new API key for current user."""
    from datetime import datetime
    
    api_key_record, key = await create_api_key(
        user_id=current_user["id"],
        name=key_data.name,
        expires_days=key_data.expires_days
    )
    
    await log_audit(
        action="api_key_created",
        user_id=current_user["id"],
        resource=f"api_key:{api_key_record['id']}"
    )
    
    return ApiKeyResponse(
        id=api_key_record["id"],
        name=api_key_record["name"],
        key=key,  # Only returned on creation
        created_at=datetime.fromisoformat(api_key_record["created_at"]),
        expires_at=datetime.fromisoformat(api_key_record["expires_at"]) if api_key_record.get("expires_at") else None,
        last_used=datetime.fromisoformat(api_key_record["last_used"]) if api_key_record.get("last_used") else None,
        is_active=api_key_record["is_active"]
    )


@router.get("/api-keys", response_model=ApiKeyListResponse)
async def list_my_api_keys(current_user=Depends(get_current_user)):
    """List all API keys for current user."""
    from datetime import datetime
    
    api_keys_table = get_table("api_keys")
    ApiKey = Query()
    
    api_keys = api_keys_table.search(ApiKey.user_id == current_user["id"])
    
    # Sort by created_at descending
    api_keys.sort(key=lambda k: k.get("created_at", ""), reverse=True)
    
    result = []
    for k in api_keys:
        result.append(ApiKeyResponse(
            id=k["id"],
            name=k["name"],
            created_at=datetime.fromisoformat(k["created_at"]),
            expires_at=datetime.fromisoformat(k["expires_at"]) if k.get("expires_at") else None,
            last_used=datetime.fromisoformat(k["last_used"]) if k.get("last_used") else None,
            is_active=k["is_active"]
        ))
    
    return ApiKeyListResponse(
        api_keys=result,
        total=len(api_keys)
    )


@router.delete("/api-keys/{key_id}")
async def revoke_api_key(key_id: str, current_user=Depends(get_current_user)):
    """Revoke an API key."""
    api_keys_table = get_table("api_keys")
    ApiKey = Query()
    
    api_keys = api_keys_table.search(
        (ApiKey.id == key_id) & (ApiKey.user_id == current_user["id"])
    )
    
    if not api_keys:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API key not found"
        )
    
    api_keys_table.update(
        {"is_active": False},
        ApiKey.id == key_id
    )
    
    await log_audit(
        action="api_key_revoked",
        user_id=current_user["id"],
        resource=f"api_key:{key_id}"
    )
    
    return {"message": "API key revoked successfully"}


# Vertex AI OAuth routes
@router.get("/vertex/url", response_model=OAuthUrlResponse)
async def get_vertex_auth_url_route() -> OAuthUrlResponse:
    """Generate OAuth2 authorization URL for Vertex AI authentication."""
    from services.auth_service import get_vertex_auth_url
    auth_url, message = get_vertex_auth_url()
    return OAuthUrlResponse(authorization_url=auth_url, state=message)


@router.post("/vertex/callback", response_model=OAuthTokenResponse)
async def handle_vertex_callback_route(callback_data: OAuthCallbackRequest) -> OAuthTokenResponse:
    """Handle OAuth2 callback and save access token."""
    from services.auth_service import handle_vertex_callback
    result = handle_vertex_callback(callback_data.code, callback_data.state)
    return OAuthTokenResponse(**result)


@router.get("/vertex/status")
async def check_vertex_auth_status_route() -> Dict[str, Any]:
    """Check if Vertex AI authentication is configured and valid."""
    from services.auth_service import check_vertex_auth_status
    return check_vertex_auth_status()
