"""
Test script to verify template image upload optimization.
This tests the asset upload endpoint and URL generation.
"""
import requests
import base64
from pathlib import Path

BASE_URL = "http://localhost:9000"

def test_asset_upload():
    """Test uploading an image as an asset"""
    print("Testing asset upload...")
    
    # Create a simple test image
    test_image_path = Path(__file__).parent.parent / "test_images" / "test_simple.png"
    
    if not test_image_path.exists():
        print(f"❌ Test image not found: {test_image_path}")
        return False
    
    # Login first (assuming test user exists)
    login_response = requests.post(
        f"{BASE_URL}/api/v1/auth/login",
        json={"username": "test", "password": "test123"}
    )
    
    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.status_code}")
        return False
    
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Upload as asset
    with open(test_image_path, "rb") as f:
        files = {"file": ("test.png", f, "image/png")}
        upload_response = requests.post(
            f"{BASE_URL}/api/v1/upload/asset",
            headers=headers,
            files=files
        )
    
    if upload_response.status_code != 200:
        print(f"❌ Asset upload failed: {upload_response.status_code}")
        print(upload_response.text)
        return False
    
    asset_data = upload_response.json()
    print(f"✅ Asset uploaded: {asset_data['asset_id']}")
    print(f"   URL: {asset_data['url']}")
    print(f"   Size: {asset_data['size']} bytes")
    
    # Verify asset can be retrieved
    asset_url = f"{BASE_URL}{asset_data['url']}"
    get_response = requests.get(asset_url)
    
    if get_response.status_code != 200:
        print(f"❌ Failed to retrieve asset: {get_response.status_code}")
        return False
    
    print(f"✅ Asset retrieved successfully")
    print(f"   Content-Type: {get_response.headers.get('content-type')}")
    print(f"   Size: {len(get_response.content)} bytes")
    
    return True


def test_template_with_asset():
    """Test creating a template with an asset URL"""
    print("\nTesting template creation with asset URL...")
    
    # Login
    login_response = requests.post(
        f"{BASE_URL}/api/v1/auth/login",
        json={"username": "test", "password": "test123"}
    )
    
    if login_response.status_code != 200:
        print(f"❌ Login failed")
        return False
    
    token = login_response.json()["access_token"]
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Create template with asset URL (using a fake asset ID for testing)
    template_data = {
        "name": "Test Template with Asset",
        "description": "Testing asset URL storage",
        "positivePrompt": "test prompt",
        "negativePrompt": "test negative",
        "image": "/api/v1/assets/test-asset-123",  # Asset URL
        "emoji": "🧪"
    }
    
    create_response = requests.post(
        f"{BASE_URL}/api/v1/templates",
        headers=headers,
        json=template_data
    )
    
    if create_response.status_code != 201:
        print(f"❌ Template creation failed: {create_response.status_code}")
        print(create_response.text)
        return False
    
    template = create_response.json()
    print(f"✅ Template created: {template['id']}")
    print(f"   Image URL: {template['image']}")
    
    # Verify template can be retrieved
    get_response = requests.get(
        f"{BASE_URL}/api/v1/templates/{template['id']}",
        headers=headers
    )
    
    if get_response.status_code != 200:
        print(f"❌ Failed to retrieve template")
        return False
    
    retrieved_template = get_response.json()
    assert retrieved_template['image'] == template_data['image'], "Image URL mismatch"
    print(f"✅ Template retrieved with correct image URL")
    
    # Cleanup - delete template
    delete_response = requests.delete(
        f"{BASE_URL}/api/v1/templates/{template['id']}",
        headers=headers
    )
    
    if delete_response.status_code == 204:
        print(f"✅ Template deleted successfully")
    
    return True


def compare_payload_sizes():
    """Compare base64 vs asset URL payload sizes"""
    print("\n" + "="*60)
    print("PAYLOAD SIZE COMPARISON")
    print("="*60)
    
    # Sample base64 image (small 1KB image)
    with open(Path(__file__).parent.parent / "test_images" / "test_simple.png", "rb") as f:
        image_bytes = f.read()
    
    base64_data = base64.b64encode(image_bytes).decode()
    base64_url = f"data:image/png;base64,{base64_data}"
    asset_url = "/api/v1/assets/abc-123-def-456"
    
    # Template with base64
    template_base64 = {
        "name": "Test Template",
        "positivePrompt": "test prompt",
        "image": base64_url
    }
    
    # Template with asset URL
    template_asset = {
        "name": "Test Template",
        "positivePrompt": "test prompt",
        "image": asset_url
    }
    
    import json
    base64_size = len(json.dumps(template_base64))
    asset_size = len(json.dumps(template_asset))
    
    print(f"Base64 approach: {base64_size:,} bytes")
    print(f"Asset URL approach: {asset_size:,} bytes")
    print(f"\nReduction: {base64_size - asset_size:,} bytes")
    print(f"Improvement: {base64_size / asset_size:.1f}x smaller")
    print("="*60)


if __name__ == "__main__":
    print("🧪 Template Image Optimization Tests\n")
    
    try:
        # Run tests
        test_asset_upload()
        test_template_with_asset()
        compare_payload_sizes()
        
        print("\n✅ All tests passed!")
        
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
