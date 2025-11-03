# Upscale Endpoint Integration Test Guide

## Overview
The upscale functionality is fully integrated between the frontend and backend (gemini_tunnel). This document explains how to test and verify the integration.

## Backend Endpoint

### Endpoint Details
- **URL**: `http://127.0.0.1:9000/upscale`
- **Method**: POST
- **Content-Type**: application/json

### Request Payload
```json
{
  "image": "base64_encoded_image_data",
  "scale": 4,
  "model": "models/imagen-3.0-generate-002"
}
```

### Response Payload
```json
{
  "model": "google-imagen-upscale",
  "scale": 4,
  "image": {
    "mime_type": "image/png",
    "b64_data": "base64_encoded_upscaled_image"
  }
}
```

## Frontend Integration

### Service Layer
The frontend uses the `upscaleService.ts` service to communicate with the backend:

**File**: `src/services/upscaleService.ts`

```typescript
export async function upscaleImage(
  request: UpscaleRequest,
  signal?: AbortSignal,
): Promise<UpscaleResponse>
```

### UI Component
The upscaling UI is handled by the `UpscalingPanel` component:

**File**: `src/components/UpscalingPanel.tsx`

Key features:
- Upload image for upscaling
- Select upscale model (fetched from `/models/imagen`)
- Set scale factor (2x to 8x, supported: 2x and 4x)
- View upscaling progress
- Save results to history

### User Flow

1. **Navigate to Upscale Mode**
   - Click the upscale icon in the side navigation
   - Or send an image from canvas/history to upscale

2. **Upload or Select Image**
   - Upload a new image using the "Upload image" button
   - Or the canvas image will be used automatically

3. **Configure Settings**
   - Select upscale model from dropdown
   - Adjust scale factor (2x-8x slider)
   - Optionally adjust advanced settings (creativity, structure)

4. **Start Upscaling**
   - Click the "Upscale ×{scale}" button
   - Progress indicator shows during processing
   - Results appear in canvas and are saved to history

## Testing Steps

### 1. Start Backend Server

```bash
cd gemini_tunnel
python -m uvicorn main:app --host 127.0.0.1 --port 9000 --reload
```

### 2. Verify OAuth Authentication

The upscale endpoint requires Google Cloud OAuth authentication.

Check auth status:
```bash
cd gemini_tunnel/scripts
python test_upscale_endpoint.py
```

If authentication is needed:
```bash
cd gemini_tunnel/scripts
python generate_auth_token.py
```

Follow the browser prompts to authorize access.

### 3. Test Backend Endpoint Directly

```bash
cd gemini_tunnel/scripts
python test_upscale_endpoint.py
```

This will:
- Check if server is running
- Verify authentication status
- Create test images
- Test upscaling with 2x and 4x scales
- Save upscaled results to `test_images/upscaled/`

### 4. Test Frontend Integration

1. Start the frontend development server:
```bash
npm run dev
```

2. Open browser to `http://localhost:5173`

3. Log in with credentials (default: admin/admin)

4. Test upscale workflow:
   - Click upscale icon in sidebar
   - Upload an image
   - Set scale to 4x
   - Click "Upscale ×4" button
   - Verify upscaled image appears in canvas
   - Check history panel for saved result (tagged as "upscall")

## Expected Results

### Backend Test Results
✅ Server health check passes
✅ Authentication is valid
✅ Image is upscaled successfully
✅ Output dimensions match expected size (original × scale)
✅ Upscaled image is saved to test_images/upscaled/

### Frontend Test Results
✅ Upscale panel loads correctly
✅ Model list is fetched from backend
✅ Image upload works
✅ Upscale request succeeds
✅ Progress indicator shows during processing
✅ Upscaled image displays in canvas
✅ Result is saved to history with "upscall" tag
✅ Image can be downloaded

## Troubleshooting

### Issue: 401 Authentication Error
**Solution**: Run OAuth token generation:
```bash
cd gemini_tunnel/scripts
python generate_auth_token.py
```

### Issue: 502 Bad Gateway
**Possible causes**:
- Vertex AI API not enabled in Google Cloud
- Billing not configured
- Model not available in region

**Solution**: 
1. Enable Vertex AI API in Google Cloud Console
2. Configure billing
3. Verify region setting in `.env` (default: us-central1)

### Issue: Image dimensions incorrect
**Cause**: Google Imagen only supports 2x and 4x upscaling
**Solution**: Backend automatically normalizes scale to nearest supported value (2 or 4)

### Issue: Server not responding
**Solution**: 
1. Stop all Python processes:
```powershell
Get-Process python,uvicorn -ErrorAction SilentlyContinue | Stop-Process -Force
```

2. Clear Python cache:
```powershell
cd gemini_tunnel
Get-ChildItem -Include __pycache__ -Recurse -Force | Remove-Item -Recurse -Force
```

3. Restart server:
```bash
python -m uvicorn main:app --host 127.0.0.1 --port 9000 --reload
```

## Configuration

### Backend Configuration
**File**: `gemini_tunnel/.env`

```env
GEMINI_API_KEY=your_api_key_here
IMAGEN_MODEL=models/imagen-3.0-generate-002
GOOGLE_CLOUD_PROJECT_ID=your_project_id
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=credentials.json
```

### Frontend Configuration
**File**: `.env` (root directory)

```env
VITE_API_BASE_URL=http://127.0.0.1:9000
```

Or configure at runtime via Settings modal in the UI.

## API Documentation

Full API documentation is available at:
```
http://127.0.0.1:9000/docs
```

This provides interactive API testing through Swagger UI.

## Success Criteria

✅ Backend server starts without errors
✅ OAuth authentication is configured and valid
✅ Test script successfully upscales images
✅ Frontend can communicate with backend
✅ Upscaling workflow completes end-to-end
✅ Results are properly saved and displayed
✅ Images can be downloaded in upscaled resolution

## Support

For issues or questions:
1. Check the API docs at `/docs` endpoint
2. Review backend logs in terminal
3. Check browser console for frontend errors
4. Verify OAuth token is valid: `GET /auth/vertex/status`
