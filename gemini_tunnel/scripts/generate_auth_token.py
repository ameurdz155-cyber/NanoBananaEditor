"""
Generate OAuth2 token for Google Cloud authentication.

This script helps you authenticate with Google Cloud to use Vertex AI APIs
(required for upscaling and inpainting features).

Prerequisites:
1. Create a Google Cloud project
2. Enable Vertex AI API
3. Create OAuth2 credentials (Desktop app)
4. Download credentials.json

Instructions:
1. Go to: https://console.cloud.google.com/apis/credentials
2. Create OAuth 2.0 Client ID (Application type: Desktop app)
3. Download JSON and save as 'credentials.json' in gemini_tunnel/
4. Run this script: python scripts/generate_auth_token.py
"""

import os
import json
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials

# Scopes required for Vertex AI
SCOPES = [
    'https://www.googleapis.com/auth/cloud-platform',
    'https://www.googleapis.com/auth/generative-language.tuning',
]

def generate_token():
    """Generate OAuth2 token from credentials.json"""
    
    credentials_file = "credentials.json"
    token_file = "token.json"
    
    print("=" * 70)
    print("🔐 Google Cloud OAuth2 Token Generator")
    print("=" * 70)
    
    # Check if credentials.json exists
    if not os.path.exists(credentials_file):
        print(f"\n❌ Error: {credentials_file} not found!")
        print("\n📋 Steps to create credentials.json:")
        print("1. Go to: https://console.cloud.google.com/apis/credentials")
        print("2. Click 'Create Credentials' → 'OAuth 2.0 Client ID'")
        print("3. Application type: 'Desktop app'")
        print("4. Download the JSON file")
        print(f"5. Save it as '{credentials_file}' in the gemini_tunnel/ directory")
        return False
    
    print(f"\n✓ Found {credentials_file}")
    
    # Check if we already have valid credentials
    creds = None
    if os.path.exists(token_file):
        print(f"✓ Found existing {token_file}")
        try:
            creds = Credentials.from_authorized_user_file(token_file, SCOPES)
            print("  Checking if token is still valid...", end=" ")
            
            if creds and creds.valid:
                print("✓ Token is valid!")
                print(f"\n🎉 You're all set! The token is saved in {token_file}")
                return True
            elif creds and creds.expired and creds.refresh_token:
                print("⚠️  Token expired, refreshing...")
                creds.refresh(Request())
                print("✓ Token refreshed successfully!")
                
                # Save refreshed credentials
                with open(token_file, 'w') as token:
                    token.write(creds.to_json())
                
                print(f"\n🎉 Refreshed token saved to {token_file}")
                return True
            else:
                print("✗ Token invalid or expired without refresh token")
                creds = None
        except Exception as e:
            print(f"✗ Error loading token: {e}")
            creds = None
    
    # Generate new credentials
    if not creds:
        print("\n🌐 Starting OAuth2 flow...")
        print("   A browser window will open for authentication.")
        print("   Please sign in with your Google account and authorize access.")
        
        try:
            flow = InstalledAppFlow.from_client_secrets_file(
                credentials_file, SCOPES
            )
            
            # Run local server for OAuth callback
            creds = flow.run_local_server(
                port=8080,
                prompt='consent',
                success_message='Authentication successful! You can close this window.'
            )
            
            # Save credentials
            with open(token_file, 'w') as token:
                token.write(creds.to_json())
            
            print(f"\n✅ Success! Token saved to {token_file}")
            print("\n📝 Token Details:")
            print(f"   • Scopes: {', '.join(SCOPES)}")
            print(f"   • Valid: {creds.valid}")
            if creds.expiry:
                print(f"   • Expires: {creds.expiry}")
            
            print("\n🎉 You can now use the upscaling and inpainting endpoints!")
            return True
            
        except Exception as e:
            print(f"\n❌ Authentication failed: {e}")
            print("\n💡 Troubleshooting:")
            print("   • Make sure you downloaded the correct OAuth2 credentials")
            print("   • Check that credentials.json is properly formatted")
            print("   • Ensure you selected 'Desktop app' as application type")
            return False
    
    return False


def verify_setup():
    """Verify Google Cloud project setup"""
    print("\n" + "=" * 70)
    print("🔍 Verifying Google Cloud Setup")
    print("=" * 70)
    
    # Load .env to check project configuration
    from dotenv import load_dotenv
    load_dotenv()
    
    project_id = os.getenv("GOOGLE_CLOUD_PROJECT_ID")
    location = os.getenv("GOOGLE_CLOUD_LOCATION")
    
    if not project_id:
        print("\n⚠️  Warning: GOOGLE_CLOUD_PROJECT_ID not set in .env")
        print("   This is required for Vertex AI API calls")
    else:
        print(f"\n✓ Project ID: {project_id}")
    
    if not location:
        print("⚠️  Warning: GOOGLE_CLOUD_LOCATION not set in .env")
        print("   Using default: us-central1")
    else:
        print(f"✓ Location: {location}")
    
    # Check if token exists
    if os.path.exists("token.json"):
        print("✓ token.json exists")
    else:
        print("✗ token.json not found")
    
    # Check credentials
    if os.path.exists("credentials.json"):
        print("✓ credentials.json exists")
        
        # Validate JSON format
        try:
            with open("credentials.json", 'r') as f:
                cred_data = json.load(f)
            
            if "installed" in cred_data or "web" in cred_data:
                print("✓ credentials.json format is valid")
            else:
                print("⚠️  credentials.json might be in wrong format")
                print("   Make sure it's OAuth2 credentials (not service account)")
        except Exception as e:
            print(f"⚠️  Error reading credentials.json: {e}")
    else:
        print("✗ credentials.json not found")
    
    print("\n📚 Required APIs to enable in Google Cloud:")
    print("   • Vertex AI API")
    print("   • Cloud AI Platform API")
    print(f"\n   Enable at: https://console.cloud.google.com/apis/library?project={project_id}")


if __name__ == "__main__":
    # Change to script's directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    os.chdir(project_root)
    
    print(f"Working directory: {os.getcwd()}\n")
    
    # Verify setup first
    verify_setup()
    
    # Generate token
    success = generate_token()
    
    if success:
        print("\n" + "=" * 70)
        print("✅ AUTHENTICATION COMPLETE")
        print("=" * 70)
        print("\nNext steps:")
        print("1. Test the upscale endpoint:")
        print("   python scripts/test_upscale_with_images.py")
        print("\n2. Or start the backend and test from the frontend:")
        print("   uvicorn main:app --host 127.0.0.1 --port 9000")
    else:
        print("\n" + "=" * 70)
        print("❌ AUTHENTICATION FAILED")
        print("=" * 70)
        print("\nPlease follow the steps above to fix the issue.")
