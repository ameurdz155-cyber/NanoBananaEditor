"""
Test script for the upscale endpoint to verify integration with gemini_tunnel.
This script tests the /upscale endpoint directly.
"""

import base64
import json
import os
from pathlib import Path
from PIL import Image
import requests
import io

# Configuration
BACKEND_URL = "http://127.0.0.1:9000"
UPSCALE_ENDPOINT = f"{BACKEND_URL}/upscale"

def create_test_image(size=(256, 256)):
    """Create a simple test image."""
    img = Image.new('RGB', size, color='blue')
    # Add some pattern
    from PIL import ImageDraw
    draw = ImageDraw.Draw(img)
    draw.rectangle([50, 50, 200, 200], fill='red', outline='white', width=3)
    draw.ellipse([100, 100, 150, 150], fill='yellow')
    return img

def image_to_base64(img):
    """Convert PIL Image to base64 string."""
    buffered = io.BytesIO()
    img.save(buffered, format="PNG")
    img_bytes = buffered.getvalue()
    return base64.b64encode(img_bytes).decode('utf-8')

def test_upscale_endpoint():
    """Test the upscale endpoint with a test image."""
    print("=" * 60)
    print("Testing Upscale Endpoint")
    print("=" * 60)
    
    # Check if server is running
    try:
        health_response = requests.get(f"{BACKEND_URL}/health", timeout=5)
        if health_response.status_code == 200:
            print("✅ Backend server is running")
        else:
            print(f"⚠️  Backend health check returned status {health_response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"❌ Cannot connect to backend server at {BACKEND_URL}")
        print(f"   Error: {e}")
        print("\n💡 Please start the backend server:")
        print("   cd gemini_tunnel")
        print("   python -m uvicorn main:app --host 127.0.0.1 --port 9000 --reload")
        return False
    
    # Create test image
    print("\n📸 Creating test image (256x256)...")
    test_img = create_test_image((256, 256))
    img_base64 = image_to_base64(test_img)
    print(f"   Base64 length: {len(img_base64)} characters")
    
    # Test different scale factors
    scales = [2, 4]
    
    for scale in scales:
        print(f"\n{'=' * 60}")
        print(f"Test: Upscale {scale}x")
        print("=" * 60)
        
        # Prepare request payload
        payload = {
            "image": img_base64,
            "scale": scale,
            "model": "models/imagen-3.0-generate-002"
        }
        
        print(f"📤 Sending request to {UPSCALE_ENDPOINT}")
        print(f"   Scale: {scale}x")
        print(f"   Model: {payload['model']}")
        
        try:
            response = requests.post(
                UPSCALE_ENDPOINT,
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=120  # 2 minutes timeout for upscaling
            )
            
            if response.status_code == 200:
                print(f"✅ Request successful (Status: {response.status_code})")
                
                # Parse response
                result = response.json()
                print(f"\n📊 Response details:")
                print(f"   Model: {result.get('model', 'N/A')}")
                print(f"   Scale: {result.get('scale', 'N/A')}x")
                
                # Check image data
                if 'image' in result and 'b64_data' in result['image']:
                    img_data = result['image']['b64_data']
                    mime_type = result['image'].get('mime_type', 'image/png')
                    print(f"   MIME type: {mime_type}")
                    print(f"   Base64 data length: {len(img_data)} characters")
                    
                    # Try to decode and get dimensions
                    try:
                        img_bytes = base64.b64decode(img_data)
                        upscaled_img = Image.open(io.BytesIO(img_bytes))
                        print(f"   Original size: 256x256")
                        print(f"   Upscaled size: {upscaled_img.width}x{upscaled_img.height}")
                        print(f"   Expected size: {256 * scale}x{256 * scale}")
                        
                        if upscaled_img.width == 256 * scale and upscaled_img.height == 256 * scale:
                            print(f"   ✅ Size matches expected dimensions!")
                        else:
                            print(f"   ⚠️  Size doesn't match expected dimensions")
                        
                        # Save the upscaled image
                        output_dir = Path(__file__).parent.parent / "test_images" / "upscaled"
                        output_dir.mkdir(parents=True, exist_ok=True)
                        output_path = output_dir / f"test_upscale_{scale}x_{upscaled_img.width}x{upscaled_img.height}.png"
                        upscaled_img.save(output_path)
                        print(f"   💾 Saved to: {output_path}")
                        
                    except Exception as e:
                        print(f"   ❌ Failed to process upscaled image: {e}")
                else:
                    print("   ⚠️  No image data in response")
                    
            elif response.status_code == 401:
                print(f"❌ Authentication failed (Status: {response.status_code})")
                print("   Please ensure Google Cloud OAuth token is valid")
                print("\n💡 Generate OAuth token:")
                print("   cd gemini_tunnel/scripts")
                print("   python generate_auth_token.py")
                try:
                    error_detail = response.json()
                    print(f"\n   Error details: {error_detail}")
                except:
                    pass
                    
            else:
                print(f"❌ Request failed (Status: {response.status_code})")
                try:
                    error_detail = response.json()
                    print(f"   Error details: {error_detail}")
                except:
                    print(f"   Response text: {response.text[:500]}")
                    
        except requests.exceptions.Timeout:
            print(f"❌ Request timed out after 120 seconds")
        except requests.exceptions.RequestException as e:
            print(f"❌ Request failed: {e}")
    
    print("\n" + "=" * 60)
    print("Test Complete")
    print("=" * 60)
    return True

def test_auth_status():
    """Check authentication status for Vertex AI."""
    print("\n" + "=" * 60)
    print("Checking Authentication Status")
    print("=" * 60)
    
    try:
        response = requests.get(f"{BACKEND_URL}/auth/vertex/status", timeout=5)
        if response.status_code == 200:
            status = response.json()
            print(f"✅ Auth status endpoint accessible")
            print(f"\n📊 Authentication details:")
            print(f"   Authenticated: {status.get('authenticated', False)}")
            print(f"   Token exists: {status.get('token_exists', False)}")
            print(f"   Token valid: {status.get('token_valid', False)}")
            print(f"   Project ID: {status.get('project_id', 'N/A')}")
            print(f"   Location: {status.get('location', 'N/A')}")
            
            if status.get('token_expiry'):
                print(f"   Token expiry: {status.get('token_expiry')}")
            
            if status.get('error'):
                print(f"   ⚠️  Error: {status.get('error')}")
            
            if not status.get('authenticated'):
                print("\n💡 Authentication needed. Run:")
                print("   cd gemini_tunnel/scripts")
                print("   python generate_auth_token.py")
            
            return status.get('authenticated', False)
        else:
            print(f"⚠️  Auth status check returned {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Cannot check auth status: {e}")
        return False

if __name__ == "__main__":
    print("🧪 Upscale Endpoint Integration Test")
    print("=" * 60)
    
    # Check authentication first
    is_authenticated = test_auth_status()
    
    # Run upscale tests
    test_upscale_endpoint()
    
    if not is_authenticated:
        print("\n" + "=" * 60)
        print("⚠️  IMPORTANT: OAuth authentication is required for upscaling")
        print("=" * 60)
        print("\nTo set up authentication:")
        print("1. cd gemini_tunnel/scripts")
        print("2. python generate_auth_token.py")
        print("3. Follow the browser authentication flow")
        print("4. Run this test again")
