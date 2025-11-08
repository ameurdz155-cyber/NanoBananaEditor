"""Configuration settings and environment variables."""

import os
from typing import List
from dotenv import load_dotenv

load_dotenv()

# API Keys and Authentication
API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    raise RuntimeError("GEMINI_API_KEY environment variable is missing")

AUTH_USERNAME = os.getenv("AUTH_USERNAME", "admin")
AUTH_PASSWORD = os.getenv("AUTH_PASSWORD", "admin")

# Model Configuration
GEMINI_FLASH_MODEL = os.getenv("GEMINI_FLASH_MODEL", "models/gemini-2.5-flash-image")
IMAGEN_MODEL = os.getenv("IMAGEN_MODEL", "models/imagen-3.0-generate-002")

# Google Cloud Configuration
GOOGLE_CLOUD_PROJECT_ID = os.getenv("GOOGLE_CLOUD_PROJECT_ID", "gen-lang-client-0772017905")
GOOGLE_CLOUD_LOCATION = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")
GOOGLE_APPLICATION_CREDENTIALS = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "credentials.json")

# OAuth2 Configuration
VERTEX_AI_SCOPES = [
    'https://www.googleapis.com/auth/cloud-platform',
    'https://www.googleapis.com/auth/generative-language.tuning',
]

# CORS Configuration
DEFAULT_ALLOWED_ORIGINS = ["*"]
raw_origins = os.getenv("ALLOWED_ORIGINS", "*")

if raw_origins.strip():
    allowed_origins = [origin.strip() for origin in raw_origins.split(",") if origin.strip()]
else:
    allowed_origins = DEFAULT_ALLOWED_ORIGINS

ALLOW_ALL_ORIGINS = "*" in allowed_origins

if ALLOW_ALL_ORIGINS:
    ALLOWED_ORIGINS = ["*"]
else:
    ALLOWED_ORIGINS = allowed_origins
