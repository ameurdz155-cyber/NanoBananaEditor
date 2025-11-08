"""Updated authentication service with database integration."""

import hashlib
import secrets
import uuid
from datetime import datetime, timedelta
from typing import Optional, Tuple

from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.context import CryptContext

from config import AUTH_USERNAME, AUTH_PASSWORD
from database import db

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT Configuration
SECRET_KEY = secrets.token_urlsafe(32)
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

# Security
security = HTTPBearer()


def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(data: dict) -> str:
    """Create JWT refresh token."""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


async def authenticate_user(username_or_email: str, password: str):
    """Authenticate user with username/email and password."""
    user = await db.user.find_first(
        where={
            "OR": [
                {"username": username_or_email},
                {"email": username_or_email}
            ],
            "is_active": True
        }
    )
    
    if not user:
        return None
    
    if not verify_password(password, user.password_hash):
        return None
    
    # Update last login
    await db.user.update(
        where={"id": user.id},
        data={"last_login": datetime.utcnow()}
    )
    
    return user


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current user from JWT token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        token_type: str = payload.get("type")
        
        if user_id is None or token_type != "access":
            raise credentials_exception
            
    except JWTError:
        raise credentials_exception
    
    user = await db.user.find_unique(where={"id": user_id})
    
    if user is None or not user.is_active:
        raise credentials_exception
    
    return user


async def get_current_admin_user(current_user = Depends(get_current_user)):
    """Get current admin user."""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user


async def create_session(user_id: str, ip_address: str = None, user_agent: str = None) -> str:
    """Create user session and return session token."""
    token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    
    expires_at = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    
    await db.session.create(
        data={
            "user_id": user_id,
            "token_hash": token_hash,
            "ip_address": ip_address,
            "user_agent": user_agent,
            "expires_at": expires_at
        }
    )
    
    return token


async def verify_session(token: str) -> Optional[dict]:
    """Verify session token and return user."""
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    
    session = await db.session.find_first(
        where={
            "token_hash": token_hash,
            "expires_at": {"gt": datetime.utcnow()}
        },
        include={"user": True}
    )
    
    if not session or not session.user.is_active:
        return None
    
    # Update last activity
    await db.session.update(
        where={"id": session.id},
        data={"last_activity": datetime.utcnow()}
    )
    
    return session.user


async def create_api_key(user_id: str, name: str, expires_days: Optional[int] = None) -> Tuple[str, dict]:
    """Create API key for user."""
    key = f"aipod_{secrets.token_urlsafe(32)}"
    key_hash = hashlib.sha256(key.encode()).hexdigest()
    
    expires_at = None
    if expires_days:
        expires_at = datetime.utcnow() + timedelta(days=expires_days)
    
    api_key = await db.apikey.create(
        data={
            "user_id": user_id,
            "key_hash": key_hash,
            "name": name,
            "expires_at": expires_at
        }
    )
    
    return key, {
        "id": api_key.id,
        "name": api_key.name,
        "created_at": api_key.created_at,
        "expires_at": api_key.expires_at
    }


async def verify_api_key(key: str):
    """Verify API key and return user."""
    key_hash = hashlib.sha256(key.encode()).hexdigest()
    
    api_key = await db.apikey.find_first(
        where={
            "key_hash": key_hash,
            "is_active": True
        },
        include={"user": True}
    )
    
    if not api_key or not api_key.user.is_active:
        return None
    
    # Check expiration
    if api_key.expires_at and api_key.expires_at < datetime.utcnow():
        return None
    
    # Update last used
    await db.apikey.update(
        where={"id": api_key.id},
        data={"last_used": datetime.utcnow()}
    )
    
    return api_key.user


async def log_audit(
    action: str,
    user_id: Optional[str] = None,
    resource: Optional[str] = None,
    details: Optional[dict] = None,
    ip_address: Optional[str] = None
):
    """Log admin action to audit log."""
    import json
    
    await db.auditlog.create(
        data={
            "user_id": user_id,
            "action": action,
            "resource": resource,
            "details": json.dumps(details) if details else None,
            "ip_address": ip_address
        }
    )


# Legacy function for backward compatibility
def validate_login(username: str, password: str) -> bool:
    """Validate user credentials (legacy)."""
    valid_usernames = {AUTH_USERNAME, f"{AUTH_USERNAME}@example.com"}
    return username.lower() in {name.lower() for name in valid_usernames} and password == AUTH_PASSWORD


def get_vertex_auth_url() -> tuple[str, str]:
    """Generate OAuth2 authorization URL for Vertex AI authentication."""
    import os
    from google_auth_oauthlib.flow import Flow
    from config import GOOGLE_APPLICATION_CREDENTIALS, VERTEX_AI_SCOPES
    
    credentials_path = GOOGLE_APPLICATION_CREDENTIALS
    
    if not os.path.isabs(credentials_path):
        credentials_path = os.path.join(os.path.dirname(__file__), "..", credentials_path)
    
    if not os.path.exists(credentials_path):
        raise HTTPException(
            status_code=500,
            detail=f"OAuth2 credentials file not found: {credentials_path}. "
                   "Please download OAuth2 credentials from Google Cloud Console and save as credentials.json"
        )
    
    try:
        flow = Flow.from_client_secrets_file(
            credentials_path,
            scopes=VERTEX_AI_SCOPES,
            redirect_uri='http://localhost:8080'
        )
        
        auth_url, state = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true',
            prompt='consent'
        )
        
        return auth_url, "Visit this URL to authorize access to Vertex AI"
        
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate authorization URL: {str(exc)}"
        ) from exc


def handle_vertex_callback(code: str, state: str) -> dict:
    """Handle OAuth2 callback and save access token."""
    import os
    from google_auth_oauthlib.flow import Flow
    from config import GOOGLE_APPLICATION_CREDENTIALS, VERTEX_AI_SCOPES
    
    credentials_path = GOOGLE_APPLICATION_CREDENTIALS
    
    if not os.path.isabs(credentials_path):
        credentials_path = os.path.join(os.path.dirname(__file__), "..", credentials_path)
    
    if not os.path.exists(credentials_path):
        raise HTTPException(
            status_code=500,
            detail="OAuth2 credentials file not found"
        )
    
    try:
        flow = Flow.from_client_secrets_file(
            credentials_path,
            scopes=VERTEX_AI_SCOPES,
            redirect_uri='http://localhost:8080'
        )
        
        flow.fetch_token(code=code)
        creds = flow.credentials
        
        token_path = "token.json"
        with open(token_path, 'w') as token_file:
            token_file.write(creds.to_json())
        
        return {
            "success": True,
            "message": f"Successfully authenticated! Token saved to {token_path}",
            "token_valid": creds.valid
        }
        
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to exchange authorization code: {str(exc)}"
        ) from exc


def check_vertex_auth_status() -> dict:
    """Check if Vertex AI authentication is configured and valid."""
    import os
    from google.oauth2.credentials import Credentials
    from google.auth.transport.requests import Request
    from config import GOOGLE_APPLICATION_CREDENTIALS, GOOGLE_CLOUD_PROJECT_ID, GOOGLE_CLOUD_LOCATION, VERTEX_AI_SCOPES
    
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
                creds.refresh(Request())
                status["authenticated"] = True
                status["token_valid"] = True
                status["token_refreshed"] = True
                
                with open(token_path, 'w') as token_file:
                    token_file.write(creds.to_json())
            else:
                status["message"] = "Token expired or invalid"
        except Exception as e:
            status["error"] = str(e)
    else:
        status["message"] = "No authentication token found. Please authenticate using /auth/vertex/url"
    
    return status


def get_google_cloud_access_token() -> Optional[str]:
    """Get access token for Google Cloud from saved credentials."""
    import os
    from google.oauth2.credentials import Credentials
    from google.auth.transport.requests import Request
    from config import GOOGLE_APPLICATION_CREDENTIALS
    
    credentials_path = GOOGLE_APPLICATION_CREDENTIALS
    
    if not os.path.isabs(credentials_path):
        credentials_path = os.path.join(os.path.dirname(__file__), "..", credentials_path)
    
    if not os.path.exists(credentials_path):
        print(f"❌ Credentials file not found at: {credentials_path}")
        return None
    
    try:
        creds = Credentials.from_authorized_user_file("token.json")
        
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
