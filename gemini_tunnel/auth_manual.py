#!/usr/bin/env python3
"""
Manual Google Cloud OAuth Authentication
For remote servers without browser access
"""
import os
from google_auth_oauthlib.flow import InstalledAppFlow

SCOPES = ['https://www.googleapis.com/auth/cloud-platform']

def authenticate_manual():
    """Start OAuth flow that outputs URL for manual authentication."""
    print("🔐 Starting manual authentication flow...")
    print("=" * 60)
    
    flow = InstalledAppFlow.from_client_secrets_file(
        'credentials.json',
        scopes=SCOPES,
        redirect_uri='urn:ietf:wg:oauth:2.0:oob'  # Out-of-band for manual auth
    )
    
    auth_url, _ = flow.authorization_url(prompt='consent')
    
    print("\n📋 STEP 1: Open this URL in your browser:")
    print("-" * 60)
    print(auth_url)
    print("-" * 60)
    
    print("\n📋 STEP 2: After authorizing, copy the authorization code")
    code = input("\n🔑 Paste the authorization code here: ").strip()
    
    print("\n⏳ Exchanging code for credentials...")
    flow.fetch_token(code=code)
    
    creds = flow.credentials
    
    # Save credentials
    with open('token.json', 'w') as token:
        token.write(creds.to_json())
    
    print("\n✅ Authentication successful!")
    print("💾 Credentials saved to token.json")
    print(f"\n📋 Token info:")
    print(f"  - Valid: {creds.valid}")
    print(f"  - Has refresh token: {bool(creds.refresh_token)}")

if __name__ == '__main__':
    authenticate_manual()
