# Gemini Image Tunnel API

FastAPI service that forwards image generation requests to Google Gemini models.

## Setup

1. Create a virtual environment and install dependencies:
   ```powershell
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   ```
2. Copy `.env.example` to `.env` and add your Google Gemini API key. Adjust model names if needed.
   ```powershell
   Copy-Item .env.example .env
   ```

## Running locally

```powershell
uvicorn main:app --reload --port 9000
```

## Endpoints

- `POST /generate/gemini` – Generates images through the Gemini 2.5 Flash model.
- `POST /generate/imagen` – Generates images with the Imagen family. Pass `{"model": "imagen-3.0-001"}` (or any supported model name) to override the default.
- `GET /models/imagen` – Lists Imagen-capable model names available to your key.

Both endpoints accept this JSON payload:

```json
{
   "prompt": "Text describing the image you want",
   "negative_prompt": "Optional text describing what to avoid",
   "num_images": 1,
   "model": "imagen-3.0-002"
}
```

Each response returns base64 PNG data for the generated images.
