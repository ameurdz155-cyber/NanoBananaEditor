"""
Test the new OAuth2 endpoints for Vertex AI authentication.

This demonstrates how to use the API to authenticate with Google Cloud.
"""

import requests
import webbrowser
from urllib.parse import urlparse, parse_qs

BASE_URL = "http://127.0.0.1:9000"

def test_auth_status():
    """Check current authentication status."""
    print("=" * 70)
    print("🔍 Checking Authentication Status")
    print("=" * 70)
    
    try:
        response = requests.get(f"{BASE_URL}/auth/vertex/status")
        
        if response.ok:
            status = response.json()
            print("\n📊 Status:")
            print(f"  ✓ Project ID: {status.get('project_id')}")
            print(f"  ✓ Location: {status.get('location')}")
            print(f"  • Credentials file exists: {status.get('credentials_exists')}")
            print(f"  • Token file exists: {status.get('token_exists')}")
            print(f"  • Token valid: {status.get('token_valid')}")
            print(f"  • Authenticated: {status.get('authenticated')}")
            
            if status.get('token_expiry'):
                print(f"  • Token expires: {status.get('token_expiry')}")
            
            if status.get('message'):
                print(f"\n💬 {status.get('message')}")
            
            if status.get('error'):
                print(f"\n⚠️  Error: {status.get('error')}")
            
            return status.get('authenticated', False)
        else:
            print(f"\n✗ Error: {response.status_code}")
            print(response.text)
            return False
            
    except Exception as e:
        print(f"\n✗ Failed to check status: {e}")
        return False


def get_auth_url():
    """Get OAuth2 authorization URL."""
    print("\n" + "=" * 70)
    print("🔗 Getting Authorization URL")
    print("=" * 70)
    
    try:
        response = requests.get(f"{BASE_URL}/auth/vertex/url")
        
        if response.ok:
            data = response.json()
            auth_url = data.get('auth_url')
            message = data.get('message')
            
            print(f"\n✓ {message}")
            print(f"\n🌐 Authorization URL:")
            print(f"{auth_url}")
            
            # Extract state from URL for reference
            parsed = urlparse(auth_url)
            params = parse_qs(parsed.query)
            state = params.get('state', [''])[0]
            
            print(f"\n📋 State: {state}")
            print("\n" + "=" * 70)
            print("📝 Next Steps:")
            print("=" * 70)
            print("1. Visit the URL above in your browser")
            print("2. Sign in with your Google account")
            print("3. Grant the requested permissions")
            print("4. You'll be redirected to localhost:8080")
            print("5. Copy the 'code' parameter from the redirect URL")
            print("6. Use that code with /auth/vertex/callback endpoint")
            print("\n💡 Or just run the full interactive flow:")
            print("   python scripts/generate_auth_token.py")
            
            return auth_url
        else:
            print(f"\n✗ Error: {response.status_code}")
            try:
                error = response.json()
                print(f"Detail: {error.get('detail')}")
            except:
                print(response.text)
            return None
            
    except Exception as e:
        print(f"\n✗ Failed to get auth URL: {e}")
        return None


def test_callback(code, state):
    """Test the callback endpoint with authorization code."""
    print("\n" + "=" * 70)
    print("🔄 Processing OAuth Callback")
    print("=" * 70)
    
    try:
        response = requests.post(
            f"{BASE_URL}/auth/vertex/callback",
            json={"code": code, "state": state}
        )
        
        if response.ok:
            data = response.json()
            print(f"\n✓ {data.get('message')}")
            print(f"  Success: {data.get('success')}")
            print(f"  Token valid: {data.get('token_valid')}")
            return True
        else:
            print(f"\n✗ Error: {response.status_code}")
            try:
                error = response.json()
                print(f"Detail: {error.get('detail')}")
            except:
                print(response.text)
            return False
            
    except Exception as e:
        print(f"\n✗ Failed to process callback: {e}")
        return False


def main():
    """Main test flow."""
    print("\n" + "=" * 70)
    print("🧪 VERTEX AI OAUTH2 ENDPOINT TEST")
    print("=" * 70)
    
    # Check if backend is running
    print("\n🔍 Checking backend...", end=" ")
    try:
        health = requests.get(f"{BASE_URL}/health", timeout=2)
        if health.ok:
            print("✓ Backend is running")
        else:
            print("✗ Backend returned error")
            return
    except Exception as e:
        print(f"✗ Cannot connect to backend")
        print(f"\n❌ Error: {e}")
        print("\n💡 Start the backend with:")
        print("   cd gemini_tunnel")
        print("   uvicorn main:app --host 127.0.0.1 --port 9000")
        return
    
    # Check current auth status
    authenticated = test_auth_status()
    
    if authenticated:
        print("\n" + "=" * 70)
        print("✅ ALREADY AUTHENTICATED")
        print("=" * 70)
        print("\nYou're already authenticated! You can:")
        print("  • Test upscaling: python scripts/test_upscale_with_images.py")
        print("  • Use the frontend to generate/upscale images")
        print("\n💡 To re-authenticate, delete token.json and run this again")
    else:
        print("\n" + "=" * 70)
        print("🔐 AUTHENTICATION REQUIRED")
        print("=" * 70)
        
        # Get authorization URL
        auth_url = get_auth_url()
        
        if auth_url:
            print("\n" + "=" * 70)
            print("⚡ QUICK AUTH (Recommended)")
            print("=" * 70)
            print("\nFor easier authentication, use this script instead:")
            print("  python scripts/generate_auth_token.py")
            print("\nIt handles the entire OAuth flow automatically!")


if __name__ == "__main__":
    main()
