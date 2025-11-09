#!/usr/bin/env python3
"""
Google Cloud OAuth Authentication Script
Generates token.json for API access
"""
import os
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow

# Scopes required for Imagen API
SCOPES = ['https://www.googleapis.com/auth/cloud-platform']

def authenticate():
    """Authenticate and save credentials."""
    creds = None
    
    # Check if token.json exists
    if os.path.exists('token.json'):
        print("📄 Loading existing credentials...")
        creds = Credentials.from_authorized_user_file('token.json', SCOPES)
    
    # If credentials are invalid or don't exist, get new ones
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            print("🔄 Refreshing expired credentials...")
            try:
                creds.refresh(Request())
                print("✅ Credentials refreshed successfully!")
            except Exception as e:
                print(f"❌ Error refreshing credentials: {e}")
                creds = None
        
        if not creds:
            print("🔐 Starting new authentication flow...")
            flow = InstalledAppFlow.from_client_secrets_file(
                'credentials.json', SCOPES)
            creds = flow.run_local_server(port=0)
            print("✅ Authentication successful!")
        
        # Save the credentials
        with open('token.json', 'w') as token:
            token.write(creds.to_json())
        print("💾 Credentials saved to token.json")
    else:
        print("✅ Valid credentials already exist!")
    
    print(f"\n📋 Token info:")
    print(f"  - Valid: {creds.valid}")
    print(f"  - Expired: {creds.expired if hasattr(creds, 'expired') else 'N/A'}")
    print(f"  - Has refresh token: {bool(creds.refresh_token)}")

if __name__ == '__main__':
    authenticate()
