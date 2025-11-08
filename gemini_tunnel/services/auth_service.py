"""Service layer for Google Cloud authentication and API calls."""

import base64
import os
import requests
from typing import Optional, List
from fastapi import HTTPException

try:
    from google.auth.transport.requests import Request
    from google.oauth2.credentials import Credentials
    from google_auth_oauthlib.flow import Flow
except ImportError as e:
    import sys
    missing = str(e).split("'")[-2] if "'" in str(e) else str(e)
    print()
    print("❌ Missing Python dependency:", missing)
    print("To fix, install the tunnel dependencies. From the project root run:")
    print("  python -m pip install -r gemini_tunnel/requirements.txt")
    print("Or install just the auth package:")
    print("  python -m pip install google-auth-oauthlib google-auth")
    print()
    sys.exit(1)

from config import (
    GOOGLE_APPLICATION_CREDENTIALS,
    GOOGLE_CLOUD_PROJECT_ID,
    GOOGLE_CLOUD_LOCATION,
    VERTEX_AI_SCOPES,
    AUTH_USERNAME,
    AUTH_PASSWORD
)


def get_google_cloud_access_token() -> Optional[str]:
    """Get access token for Google Cloud from saved credentials."""
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


def validate_login(username: str, password: str) -> bool:
    """Validate user credentials."""
    valid_usernames = {AUTH_USERNAME, f"{AUTH_USERNAME}@example.com"}
    return username.lower() in {name.lower() for name in valid_usernames} and password == AUTH_PASSWORD


def get_vertex_auth_url() -> tuple[str, str]:
    """Generate OAuth2 authorization URL for Vertex AI authentication."""
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
