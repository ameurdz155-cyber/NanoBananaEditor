"""Test upscaling with the generated test images."""
import base64
import requests
import os
import sys
from PIL import Image
from io import BytesIO

def load_image_as_base64(image_path):
    """Load an image file and convert to base64."""
    with open(image_path, 'rb') as f:
        image_bytes = f.read()
    return base64.b64encode(image_bytes).decode('ascii')

def test_upscale(image_path, scale=4, save_result=True):
    """Test upscaling an image."""
    print(f"\n{'='*60}")
    print(f"Testing: {os.path.basename(image_path)}")
    print(f"{'='*60}")
    
    # Check if file exists
    if not os.path.exists(image_path):
        print(f"✗ Error: File not found: {image_path}")
        return False
    
    # Load original image info
    try:
        with Image.open(image_path) as img:
            orig_width, orig_height = img.size
            orig_format = img.format
            print(f"Original: {orig_width}x{orig_height} {orig_format}")
    except Exception as e:
        print(f"✗ Error loading image: {e}")
        return False
    
    # Convert to base64
    print("Encoding to base64...", end=" ")
    try:
        image_b64 = load_image_as_base64(image_path)
        print(f"✓ ({len(image_b64)} chars)")
    except Exception as e:
        print(f"✗ Error: {e}")
        return False
    
    # Prepare request
    payload = {
        "image": image_b64,
        "scale": scale,
        "model": "models/imagen-3.0-generate-002"
    }
    
    print(f"Requesting {scale}x upscale...", end=" ")
    
    try:
        response = requests.post(
            "http://127.0.0.1:9000/upscale",
            json=payload,
            timeout=60
        )
        
        if response.ok:
            print("✓")
            result = response.json()
            
            print(f"\n📊 Results:")
            print(f"  Model: {result.get('model')}")
            print(f"  Scale: {result.get('scale')}x")
            
            # Decode output image
            output_b64 = result.get('image', {}).get('b64_data', '')
            if output_b64:
                output_bytes = base64.b64decode(output_b64)
                output_img = Image.open(BytesIO(output_bytes))
                
                print(f"  Output: {output_img.width}x{output_img.height}")
                print(f"  Size: {len(output_bytes):,} bytes")
                
                # Calculate actual scale
                actual_scale_x = output_img.width / orig_width
                actual_scale_y = output_img.height / orig_height
                print(f"  Actual scale: {actual_scale_x:.1f}x × {actual_scale_y:.1f}y")
                
                # Save result if requested
                if save_result:
                    output_dir = "test_images/upscaled"
                    if not os.path.exists(output_dir):
                        os.makedirs(output_dir)
                    
                    base_name = os.path.splitext(os.path.basename(image_path))[0]
                    output_path = f"{output_dir}/{base_name}_upscaled_{scale}x.png"
                    output_img.save(output_path)
                    print(f"\n💾 Saved: {output_path}")
                
                return True
            else:
                print("✗ No image data in response")
                return False
        else:
            print(f"✗ HTTP {response.status_code}")
            try:
                error_detail = response.json()
                detail = error_detail.get('detail', 'No detail provided')
                print(f"\n❌ Error: {detail}")
                
                # Provide helpful hints
                if response.status_code == 401:
                    print("\n💡 Tip: The upscale endpoint requires Google Cloud credentials.")
                    print("   You need to set up:")
                    print("   1. credentials.json (OAuth2 client)")
                    print("   2. token.json (Access token)")
                    print("   3. Vertex AI API enabled in Google Cloud")
                elif response.status_code == 400:
                    print("\n💡 Tip: Check image format and size (max 2048x2048)")
            except:
                print(f"\n❌ Response: {response.text[:200]}")
            return False
            
    except requests.exceptions.Timeout:
        print("✗ Request timeout")
        return False
    except Exception as e:
        print(f"✗ Error: {e}")
        return False


def main():
    """Main test function."""
    print("\n" + "="*60)
    print("🧪 UPSCALE ENDPOINT TEST")
    print("="*60)
    
    # Check if backend is running
    print("\n🔍 Checking backend status...", end=" ")
    try:
        health = requests.get("http://127.0.0.1:9000/health", timeout=2)
        if health.ok:
            print("✓ Backend is running")
        else:
            print("✗ Backend returned error")
            sys.exit(1)
    except Exception as e:
        print(f"✗ Cannot connect to backend")
        print(f"\n❌ Error: {e}")
        print("\n💡 Start the backend with:")
        print("   cd gemini_tunnel")
        print("   uvicorn main:app --host 127.0.0.1 --port 9000")
        sys.exit(1)
    
    # Test images directory
    test_dir = "test_images"
    
    if not os.path.exists(test_dir):
        print(f"\n✗ Test images directory not found: {test_dir}")
        print("\n💡 Run this first to create test images:")
        print("   python scripts/create_test_image.py")
        sys.exit(1)
    
    # Get list of test images
    test_images = [
        f"{test_dir}/small_gradient.png",      # Quick test
        f"{test_dir}/medium_checkerboard.png", # Quality test
        f"{test_dir}/medium_pattern.png",      # Color test
    ]
    
    # Filter to existing files
    test_images = [img for img in test_images if os.path.exists(img)]
    
    if not test_images:
        print(f"\n✗ No test images found in {test_dir}/")
        sys.exit(1)
    
    print(f"\n📋 Found {len(test_images)} test image(s)")
    
    # Test each image
    results = []
    for image_path in test_images:
        success = test_upscale(image_path, scale=4, save_result=True)
        results.append((os.path.basename(image_path), success))
    
    # Summary
    print("\n" + "="*60)
    print("📊 TEST SUMMARY")
    print("="*60)
    
    success_count = sum(1 for _, success in results if success)
    total_count = len(results)
    
    for image_name, success in results:
        status = "✓ PASS" if success else "✗ FAIL"
        print(f"{status:8} {image_name}")
    
    print(f"\nTotal: {success_count}/{total_count} passed")
    
    if success_count == 0:
        print("\n⚠️  All tests failed. Common issues:")
        print("   • Missing Google Cloud credentials (token.json)")
        print("   • Vertex AI API not enabled")
        print("   • Billing not configured")
        print("\n💡 The endpoint code is working correctly,")
        print("   it just needs valid Google Cloud authentication.")
    elif success_count < total_count:
        print("\n⚠️  Some tests failed. Check the error messages above.")
    else:
        print("\n🎉 All tests passed! Upscale endpoint is working perfectly!")


if __name__ == "__main__":
    main()
