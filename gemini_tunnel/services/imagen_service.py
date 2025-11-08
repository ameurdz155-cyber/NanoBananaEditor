"""Google Imagen service for upscaling and inpainting."""

import base64
import requests
from typing import List, Optional
from io import BytesIO
from PIL import Image
from fastapi import HTTPException

from config import GOOGLE_CLOUD_PROJECT_ID, GOOGLE_CLOUD_LOCATION
from services.auth_service import get_google_cloud_access_token
from utils import normalize_base64


def upscale_with_google_imagen(image_data: bytes, upscale_factor: int) -> bytes:
    """Upscale image using Google Imagen via REST API."""
    
    access_token = get_google_cloud_access_token()
    if not access_token:
        raise HTTPException(status_code=401, detail="Google Cloud authentication failed. Please check credentials.")
    
    if upscale_factor not in [2, 4]:
        upscale_factor = 4
    
    encoded_string = base64.b64encode(image_data).decode("utf-8")
    
    url = f"https://{GOOGLE_CLOUD_LOCATION}-aiplatform.googleapis.com/v1/projects/{GOOGLE_CLOUD_PROJECT_ID}/locations/{GOOGLE_CLOUD_LOCATION}/publishers/google/models/imagegeneration@006:predict"
    
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "instances": [
            {
                "image": {
                    "bytesBase64Encoded": encoded_string
                },
                "prompt": ""
            }
        ],
        "parameters": {
            "sampleCount": 1,
            "mode": "upscale",
            "upscaleConfig": {
                "upscaleFactor": f"x{upscale_factor}"
            }
        }
    }

    try:
        response = requests.post(url, headers=headers, json=payload, timeout=120)
        
        if response.status_code != 200:
            error_msg = f"Google Cloud API request failed with status {response.status_code}"
            if response.status_code == 403:
                error_msg += ". Check if Vertex AI API is enabled and billing is configured."
            elif response.status_code == 404:
                error_msg += ". Model not available in this region."
            raise HTTPException(status_code=502, detail=error_msg)
        
        result = response.json()
        
        if "predictions" not in result or len(result["predictions"]) == 0:
            raise HTTPException(status_code=502, detail="No predictions returned from Google Cloud API")
        
        prediction = result["predictions"][0]
        
        if "bytesBase64Encoded" not in prediction:
            raise HTTPException(status_code=502, detail="No image data in Google Cloud API response")
        
        upscaled_base64 = prediction["bytesBase64Encoded"]
        return base64.b64decode(upscaled_base64)
        
    except requests.exceptions.Timeout:
        raise HTTPException(status_code=504, detail="Google Cloud API request timed out")
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=502, detail=f"Network error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Upscaling failed: {str(e)}")


def inpaint_with_google_imagen(
    image_data: bytes, 
    prompt: str,
    mask_image_data: Optional[bytes] = None,
    mask_mode: str = "MASK_MODE_USER_PROVIDED",
    mask_classes: Optional[List[int]] = None,
    mask_dilation: float = 0.01,
    edit_steps: int = 35,
    sample_count: int = 1
) -> List[bytes]:
    """Insert objects into image using Google Imagen inpainting."""
    
    access_token = get_google_cloud_access_token()
    if not access_token:
        raise HTTPException(status_code=401, detail="Google Cloud authentication failed. Please check credentials.")
    
    base_image_b64 = base64.b64encode(image_data).decode("utf-8")
    
    url = f"https://{GOOGLE_CLOUD_LOCATION}-aiplatform.googleapis.com/v1/projects/{GOOGLE_CLOUD_PROJECT_ID}/locations/{GOOGLE_CLOUD_LOCATION}/publishers/google/models/imagen-3.0-capability-001:predict"
    
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    reference_images = [
        {
            "referenceType": "REFERENCE_TYPE_RAW",
            "referenceId": 1,
            "referenceImage": {
                "bytesBase64Encoded": base_image_b64
            }
        }
    ]
    
    if mask_mode == "MASK_MODE_USER_PROVIDED" and mask_image_data:
        mask_image_b64 = base64.b64encode(mask_image_data).decode("utf-8")
        reference_images.append({
            "referenceType": "REFERENCE_TYPE_MASK",
            "referenceImage": {
                "bytesBase64Encoded": mask_image_b64
            },
            "maskImageConfig": {
                "maskMode": mask_mode,
                "dilation": mask_dilation
            }
        })
    else:
        mask_config = {
            "maskMode": mask_mode,
            "dilation": mask_dilation
        }
        
        if mask_mode == "MASK_MODE_SEMANTIC" and mask_classes:
            mask_config["maskClasses"] = mask_classes
            
        reference_images.append({
            "referenceType": "REFERENCE_TYPE_MASK",
            "referenceId": 2,
            "maskImageConfig": mask_config
        })
    
    payload = {
        "instances": [
            {
                "prompt": prompt,
                "referenceImages": reference_images
            }
        ],
        "parameters": {
            "editConfig": {
                "baseSteps": edit_steps
            },
            "editMode": "EDIT_MODE_INPAINT_INSERTION",
            "sampleCount": sample_count
        }
    }

    try:
        response = requests.post(url, headers=headers, json=payload, timeout=180)
        
        if response.status_code != 200:
            error_msg = f"Google Cloud API request failed with status {response.status_code}"
            if response.status_code == 403:
                error_msg += ". Check if Vertex AI API is enabled and billing is configured."
            elif response.status_code == 404:
                error_msg += ". Model not available in this region."
            elif response.status_code == 400:
                try:
                    error_detail = response.json()
                    error_msg += f". Error details: {error_detail}"
                except:
                    error_msg += f". Response: {response.text}"
            raise HTTPException(status_code=502, detail=error_msg)
        
        result = response.json()
        
        if "predictions" not in result or len(result["predictions"]) == 0:
            raise HTTPException(status_code=502, detail="No predictions returned from Google Cloud API")
        
        edited_images = []
        for prediction in result["predictions"]:
            if "bytesBase64Encoded" not in prediction:
                continue
            image_bytes = base64.b64decode(prediction["bytesBase64Encoded"])
            edited_images.append(image_bytes)
        
        if not edited_images:
            raise HTTPException(status_code=502, detail="No image data in Google Cloud API response")
        
        return edited_images
        
    except requests.exceptions.Timeout:
        raise HTTPException(status_code=504, detail="Google Cloud API request timed out")
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=502, detail=f"Network error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Inpainting failed: {str(e)}")
