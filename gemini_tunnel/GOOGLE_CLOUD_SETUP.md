# Google Cloud Setup for Imagen Upscaling

The upscale feature requires Google Cloud authentication. Follow these steps:

## Prerequisites
- Google Cloud Project with Vertex AI API enabled
- Billing enabled on the project

## Setup Steps

### 1. Enable Vertex AI API
```bash
gcloud services enable aiplatform.googleapis.com
```

### 2. Create OAuth 2.0 Credentials
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Click **Create Credentials** → **OAuth 2.0 Client ID**
4. Choose **Desktop Application**
5. Download the JSON file and save it as `credentials.json` in the `gemini_tunnel/` folder

### 3. Authenticate and Generate Token
Run the authentication script:
```bash
cd gemini_tunnel
python scripts/generate_auth_token.py
```

This will:
- Open a browser for you to authenticate
- Generate `token.json` with your access/refresh tokens
- Store it in `gemini_tunnel/`

### 4. Set Environment Variables
Add to your `.env` or system environment:
```env
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=credentials.json
```

### 5. Restart Backend
```bash
cd gemini_tunnel
python main.py
```

## Alternative: Service Account (Production)

For production, use a service account instead:

1. Create Service Account:
```bash
gcloud iam service-accounts create imagen-upscale \
    --display-name="Imagen Upscale Service"
```

2. Grant Vertex AI User role:
```bash
gcloud projects add-iam-policy-binding PROJECT_ID \
    --member="serviceAccount:imagen-upscale@PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/aiplatform.user"
```

3. Create and download key:
```bash
gcloud iam service-accounts keys create credentials.json \
    --iam-account=imagen-upscale@PROJECT_ID.iam.gserviceaccount.com
```

4. Update `auth_service.py` to use service account credentials instead of OAuth tokens.

## Troubleshooting

### 401 Error
- Ensure `token.json` exists and is valid
- Check if token is expired (tokens expire after 1 hour)
- Verify Vertex AI API is enabled

### File Not Found
- Ensure `credentials.json` is in `gemini_tunnel/` folder
- Check `GOOGLE_APPLICATION_CREDENTIALS` path in `config.py`

### Invalid Credentials
- Regenerate `token.json` using the auth script
- Verify OAuth consent screen is configured in Google Cloud Console
