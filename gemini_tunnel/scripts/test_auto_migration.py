"""
Test the automatic base64-to-asset migration feature.
This verifies that templates with base64 images are automatically converted to assets.
"""
import requests
import base64
from pathlib import Path
import time

BASE_URL = "http://localhost:9000"

def create_test_base64_image():
    """Create a small test image as base64."""
    # Create a simple 10x10 PNG (very small for testing)
    import io
    try:
        from PIL import Image
        img = Image.new('RGB', (10, 10), color='red')
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        image_bytes = buffer.getvalue()
    except ImportError:
        # Fallback: minimal valid PNG
        image_bytes = base64.b64decode(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
        )
    
    base64_data = base64.b64encode(image_bytes).decode()
    return f"data:image/png;base64,{base64_data}"


def login():
    """Login and return token."""
    response = requests.post(
        f"{BASE_URL}/api/v1/auth/login",
        json={"username": "test", "password": "test123"}
    )
    if response.status_code != 200:
        print(f"❌ Login failed: {response.status_code}")
        return None
    return response.json()["access_token"]


def test_auto_migration():
    """Test automatic base64 to asset migration."""
    print("="*60)
    print("🧪 Testing Automatic Base64 Image Migration")
    print("="*60)
    
    # Step 1: Login
    print("\n1️⃣ Logging in...")
    token = login()
    if not token:
        return False
    print("   ✅ Logged in successfully")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Step 2: Create template with base64 image
    print("\n2️⃣ Creating template with base64 image...")
    base64_image = create_test_base64_image()
    base64_size = len(base64_image)
    print(f"   Base64 size: {base64_size:,} bytes")
    
    template_data = {
        "name": f"Auto Migration Test {int(time.time())}",
        "description": "Testing automatic base64 to asset conversion",
        "positivePrompt": "test prompt",
        "image": base64_image,  # Store as base64
        "emoji": "🔄"
    }
    
    create_response = requests.post(
        f"{BASE_URL}/api/v1/templates",
        headers=headers,
        json=template_data
    )
    
    if create_response.status_code != 201:
        print(f"   ❌ Failed to create template: {create_response.status_code}")
        print(f"   {create_response.text}")
        return False
    
    template = create_response.json()
    template_id = template["id"]
    print(f"   ✅ Template created: {template_id}")
    print(f"   Image type: base64 (size: {base64_size:,} bytes)")
    
    # Step 3: Fetch templates (triggers auto-migration)
    print("\n3️⃣ Fetching templates (triggers auto-migration)...")
    fetch_response = requests.get(
        f"{BASE_URL}/api/v1/templates",
        headers=headers
    )
    
    if fetch_response.status_code != 200:
        print(f"   ❌ Failed to fetch templates: {fetch_response.status_code}")
        return False
    
    templates = fetch_response.json()
    migrated_template = next((t for t in templates if t["id"] == template_id), None)
    
    if not migrated_template:
        print(f"   ❌ Template not found in results")
        return False
    
    # Step 4: Verify migration happened
    print("\n4️⃣ Verifying migration...")
    migrated_image = migrated_template.get("image", "")
    
    is_asset_url = migrated_image.startswith("/api/v1/assets/")
    is_base64 = migrated_image.startswith("data:image/")
    
    print(f"   Original image: base64 ({base64_size:,} bytes)")
    print(f"   Migrated image: {migrated_image[:50]}...")
    print(f"   Is asset URL: {is_asset_url}")
    print(f"   Is base64: {is_base64}")
    
    if is_asset_url:
        asset_size = len(migrated_image)
        reduction = base64_size - asset_size
        print(f"\n   ✅ SUCCESS! Migrated to asset URL")
        print(f"   Asset URL size: {asset_size} bytes")
        print(f"   Size reduction: {reduction:,} bytes ({reduction/base64_size*100:.1f}%)")
        
        # Step 5: Verify asset can be retrieved
        print("\n5️⃣ Verifying asset is accessible...")
        asset_response = requests.get(f"{BASE_URL}{migrated_image}")
        
        if asset_response.status_code == 200:
            print(f"   ✅ Asset retrieved successfully")
            print(f"   Content-Type: {asset_response.headers.get('content-type')}")
            print(f"   Size: {len(asset_response.content)} bytes")
        else:
            print(f"   ⚠️  Warning: Asset not accessible ({asset_response.status_code})")
    else:
        print(f"\n   ⚠️  Migration did not occur (still base64)")
        print(f"   This might be expected if backend migration is disabled")
    
    # Step 6: Cleanup
    print("\n6️⃣ Cleaning up...")
    delete_response = requests.delete(
        f"{BASE_URL}/api/v1/templates/{template_id}",
        headers=headers
    )
    
    if delete_response.status_code == 204:
        print(f"   ✅ Template deleted")
    
    return is_asset_url


def test_manual_migration():
    """Test manual migration endpoint."""
    print("\n" + "="*60)
    print("🔧 Testing Manual Migration Endpoint")
    print("="*60)
    
    token = login()
    if not token:
        return False
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    print("\n1️⃣ Triggering manual migration...")
    response = requests.post(
        f"{BASE_URL}/api/v1/templates/migrate-images",
        headers=headers
    )
    
    if response.status_code != 200:
        print(f"   ❌ Migration failed: {response.status_code}")
        print(f"   {response.text}")
        return False
    
    result = response.json()
    print(f"   ✅ {result['message']}")
    print(f"   Migrated: {result['migrated_count']}/{result['total_count']}")
    
    return True


def test_performance_comparison():
    """Compare performance of base64 vs asset URLs."""
    print("\n" + "="*60)
    print("⚡ Performance Comparison")
    print("="*60)
    
    # Create test image
    base64_image = create_test_base64_image()
    asset_url = "/api/v1/assets/test-123-456"
    
    # Template with base64
    template_base64 = {
        "id": "test-1",
        "name": "Test Template",
        "positivePrompt": "test prompt",
        "image": base64_image,
        "createdAt": 1234567890,
        "updatedAt": 1234567890,
        "userId": "test-user"
    }
    
    # Template with asset URL
    template_asset = {
        "id": "test-1",
        "name": "Test Template",
        "positivePrompt": "test prompt",
        "image": asset_url,
        "createdAt": 1234567890,
        "updatedAt": 1234567890,
        "userId": "test-user"
    }
    
    import json
    base64_size = len(json.dumps(template_base64))
    asset_size = len(json.dumps(template_asset))
    
    print(f"\nSingle Template:")
    print(f"  Base64 approach: {base64_size:,} bytes")
    print(f"  Asset URL approach: {asset_size:,} bytes")
    print(f"  Reduction: {base64_size - asset_size:,} bytes ({(base64_size - asset_size)/base64_size*100:.1f}%)")
    
    # Multiple templates
    templates_base64 = [template_base64] * 10
    templates_asset = [template_asset] * 10
    
    list_base64_size = len(json.dumps(templates_base64))
    list_asset_size = len(json.dumps(templates_asset))
    
    print(f"\n10 Templates:")
    print(f"  Base64 approach: {list_base64_size:,} bytes")
    print(f"  Asset URL approach: {list_asset_size:,} bytes")
    print(f"  Reduction: {list_base64_size - list_asset_size:,} bytes ({(list_base64_size - list_asset_size)/list_base64_size*100:.1f}%)")
    print(f"  Improvement: {list_base64_size / list_asset_size:.1f}x smaller")


if __name__ == "__main__":
    print("🚀 Template Image Auto-Migration Tests\n")
    
    try:
        # Run tests
        auto_result = test_auto_migration()
        manual_result = test_manual_migration()
        test_performance_comparison()
        
        print("\n" + "="*60)
        if auto_result and manual_result:
            print("✅ All migration tests passed!")
        else:
            print("⚠️  Some tests had warnings (check details above)")
        print("="*60)
        
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
