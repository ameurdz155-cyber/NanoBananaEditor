"""Updated authentication service with TinyDB database integration."""

import hashlib
import secrets
import uuid
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List, Tuple

from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.context import CryptContext
from tinydb import Query

from database import get_table

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT Configuration
SECRET_KEY = secrets.token_urlsafe(32)
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60
REFRESH_TOKEN_EXPIRE_DAYS = 7

# Security
security = HTTPBearer()


def hash_password(password: str) -> str:
    """Hash a password using bcrypt (truncates to 72 bytes for bcrypt)."""
    # Bcrypt has a 72 byte limit, truncate if needed
    if len(password.encode('utf-8')) > 72:
        password = password[:72]
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


async def authenticate_user(username_or_email: str, password: str) -> Optional[Dict[str, Any]]:
    """Authenticate user with username/email and password."""
    users_table = get_table("users")
    User = Query()
    
    # Find user by username or email
    users = users_table.search(
        ((User.username == username_or_email) | (User.email == username_or_email)) &
        (User.is_active == True)
    )
    
    if not users:
        return None
    
    user = users[0]
    
    if not verify_password(password, user["password_hash"]):
        return None
    
    # Update last login
    users_table.update(
        {"last_login": datetime.utcnow().isoformat()},
        doc_ids=[user.doc_id]
    )
    
    return user


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
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
    
    # Get user from database
    users_table = get_table("users")
    User = Query()
    users = users_table.search(User.id == user_id)
    
    if not users:
        raise credentials_exception
    
    user = users[0]
    
    if not user.get("is_active"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    return user


async def get_current_admin_user(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    """Verify current user is an admin."""
    if not current_user.get("is_admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions. Admin access required."
        )
    return current_user


async def get_current_superuser(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    """Verify current user is a superuser."""
    if not current_user.get("is_superuser"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions. Superuser access required."
        )
    return current_user


async def create_session(user_id: str, ip_address: Optional[str] = None, user_agent: Optional[str] = None) -> Dict[str, Any]:
    """Create a new session for user."""
    sessions_table = get_table("sessions")
    
    session = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "token_hash": secrets.token_urlsafe(32),
        "ip_address": ip_address,
        "user_agent": user_agent,
        "expires_at": (datetime.utcnow() + timedelta(days=7)).isoformat(),
        "created_at": datetime.utcnow().isoformat(),
        "last_activity": datetime.utcnow().isoformat()
    }
    
    sessions_table.insert(session)
    return session


async def verify_session(session_id: str) -> Optional[Dict[str, Any]]:
    """Verify session is valid."""
    sessions_table = get_table("sessions")
    Session = Query()
    
    sessions = sessions_table.search(Session.id == session_id)
    if not sessions:
        return None
    
    session = sessions[0]
    
    # Check expiration
    if datetime.fromisoformat(session["expires_at"]) < datetime.utcnow():
        return None
    
    # Update last activity
    sessions_table.update(
        {"last_activity": datetime.utcnow().isoformat()},
        doc_ids=[session.doc_id]
    )
    
    return session


def generate_api_key() -> str:
    """Generate a new API key."""
    return f"sk_live_{secrets.token_urlsafe(32)}"


async def create_api_key(user_id: str, name: str, expires_days: Optional[int] = None) -> Tuple[Dict[str, Any], str]:
    """Create a new API key for user."""
    api_keys_table = get_table("api_keys")
    
    # Generate key
    key = generate_api_key()
    key_hash = hashlib.sha256(key.encode()).hexdigest()
    
    expires_at = None
    if expires_days:
        expires_at = (datetime.utcnow() + timedelta(days=expires_days)).isoformat()
    
    api_key = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "key_hash": key_hash,
        "name": name,
        "is_active": True,
        "expires_at": expires_at,
        "last_used": None,
        "created_at": datetime.utcnow().isoformat()
    }
    
    api_keys_table.insert(api_key)
    
    # Return both the key record and the actual key (only time it's visible)
    return api_key, key


async def verify_api_key(api_key: str) -> Optional[Dict[str, Any]]:
    """Verify API key and return associated user."""
    key_hash = hashlib.sha256(api_key.encode()).hexdigest()
    
    api_keys_table = get_table("api_keys")
    ApiKey = Query()
    
    keys = api_keys_table.search(
        (ApiKey.key_hash == key_hash) & (ApiKey.is_active == True)
    )
    
    if not keys:
        return None
    
    key_record = keys[0]
    
    # Check expiration
    if key_record.get("expires_at"):
        if datetime.fromisoformat(key_record["expires_at"]) < datetime.utcnow():
            return None
    
    # Update last used
    api_keys_table.update(
        {"last_used": datetime.utcnow().isoformat()},
        doc_ids=[key_record.doc_id]
    )
    
    # Get user
    users_table = get_table("users")
    User = Query()
    users = users_table.search(User.id == key_record["user_id"])
    
    if not users or not users[0].get("is_active"):
        return None
    
    return users[0]


async def log_audit(
    user_id: Optional[str],
    action: str,
    resource: Optional[str] = None,
    details: Optional[str] = None,
    ip_address: Optional[str] = None
):
    """Log an audit event."""
    audit_logs_table = get_table("audit_logs")
    
    log = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "action": action,
        "resource": resource,
        "details": details,
        "ip_address": ip_address,
        "created_at": datetime.utcnow().isoformat()
    }
    
    audit_logs_table.insert(log)
