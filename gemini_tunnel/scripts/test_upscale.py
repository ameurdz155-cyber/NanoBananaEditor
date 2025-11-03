"""Test the /upscale endpoint with a minimal image payload."""
import base64
import requests
from PIL import Image
from io import BytesIO

# Create a small test image (10x10 red square)
img = Image.new('RGB', (10, 10), color='red')
buffer = BytesIO()
img.save(buffer, format='PNG')
image_bytes = buffer.getvalue()

# Encode to base64
image_b64 = base64.b64encode(image_bytes).decode('ascii')

# Prepare the request
payload = {
    "image": image_b64,
    "scale": 4,
    "model": "models/imagen-3.0-generate-002"
}

print("Sending upscale request to http://127.0.0.1:9000/upscale")
print(f"Input image size: {len(image_bytes)} bytes")
print(f"Scale: {payload['scale']}x")
print(f"Model: {payload['model']}")

try:
    response = requests.post(
        "http://127.0.0.1:9000/upscale",
        json=payload,
        timeout=30
    )
    
    print(f"\nResponse status: {response.status_code}")
    
    if response.ok:
        result = response.json()
        print(f"✓ Success!")
        print(f"  Model used: {result.get('model')}")
        print(f"  Scale: {result.get('scale')}x")
        print(f"  Output image size: {len(result.get('image', {}).get('b64_data', ''))} chars")
        
        # Try to decode and check dimensions
        output_b64 = result.get('image', {}).get('b64_data', '')
        if output_b64:
            output_bytes = base64.b64decode(output_b64)
            output_img = Image.open(BytesIO(output_bytes))
            print(f"  Output dimensions: {output_img.width}x{output_img.height}")
    else:
        print(f"✗ Error: {response.status_code}")
        try:
            error_detail = response.json()
            print(f"  Detail: {error_detail.get('detail', 'No detail provided')}")
        except:
            print(f"  Response text: {response.text}")
            
except Exception as e:
    print(f"✗ Request failed: {e}")
