import os
from google import genai
from google.genai import types
from PIL import Image  # For saving the output image if needed
from io import BytesIO

# Add variables for configuration, including the key (service account key file path for authentication)
service_account_key_path = 'path/to/your_service_account_key.json'  # Replace with your service account key file path
project_id = 'your-project-id'  # Replace with your Google Cloud project ID
location = 'us-central1'  # Replace with your preferred location, e.g., 'us-central1'
input_image_path = 'path/to/your/input_image.jpg'  # Replace with the path to the image you want to upscale
upscale_factor = 'x2'  # Can be 'x2' or 'x4' depending on model support
output_image_path = 'path/to/output_upscaled_image.png'  # Where to save the upscaled image
model_name = 'imagen-3.0-generate-002'  # Imagen 3 model version

# Set up authentication using the service account key
os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = service_account_key_path

# Create the client for Vertex AI
client = genai.Client(vertexai=True, project=project_id, location=location)

# Load the input image from file
with open(input_image_path, 'rb') as f:
    image_bytes = f.read()

# Determine MIME type (you can adjust based on your file type)
mime_type = 'image/jpeg' if input_image_path.lower().endswith('.jpg') or input_image_path.lower().endswith('.jpeg') else 'image/png'

input_image = types.Image.from_bytes(data=image_bytes, mime_type=mime_type)

# Upscale the image
response = client.models.upscale_image(
    model=model_name,
    image=input_image,
    upscale_factor=upscale_factor,
    config=types.UpscaleImageConfig(
        include_rai_reason=True,
        output_mime_type='image/png'  # Or 'image/jpeg' as needed
    )
)

# Get the upscaled image
upscaled_image = response.generated_images[0].image

# Display the upscaled image (optional)
upscaled_image.show()

# Save the upscaled image to file
with open(output_image_path, 'wb') as f:
    f.write(upscaled_image.image_bytes)

print(f'Upscaled image saved to {output_image_path}')