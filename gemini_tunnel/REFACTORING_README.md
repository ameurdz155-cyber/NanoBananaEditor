# Gemini Tunnel - Refactored Structure

## 📁 Project Structure

```
gemini_tunnel/
├── main_refactored.py      # New refactored entry point (FastAPI app)
├── main.py                  # Original monolithic file (kept for reference)
├── config.py                # Configuration and environment variables
├── models.py                # Pydantic request/response models
├── utils.py                 # Utility functions (image processing, formatting)
│
├── services/                # Business logic layer
│   ├── __init__.py
│   ├── auth_service.py      # Authentication & OAuth2 logic
│   ├── gemini_service.py    # Gemini AI operations
│   └── imagen_service.py    # Google Imagen operations
│
└── routes/                  # API endpoints
    ├── __init__.py
    ├── auth.py              # /auth/* endpoints
    ├── generation.py        # /generate/* endpoints
    ├── editing.py           # /edit/* endpoints
    └── upscale.py           # /upscale, /inpaint endpoints
```

## 🎯 Key Improvements

### 1. **Separation of Concerns**
- **Config**: All environment variables and settings in one place
- **Models**: Clean Pydantic schemas for validation
- **Services**: Business logic separated from API routes
- **Routes**: Thin controllers that delegate to services
- **Utils**: Reusable helper functions

### 2. **Maintainability**
- **Modularity**: Each file has a single, clear responsibility
- **Testability**: Services can be tested independently
- **Scalability**: Easy to add new features without bloating files

### 3. **Code Organization**
- **870+ lines** → **~50-200 lines per file**
- Clear import structure
- No duplicate functions
- Type hints throughout

## 🚀 Usage

### Running the Refactored Version

```bash
# From the gemini_tunnel directory
uvicorn main_refactored:app --reload --host 0.0.0.0 --port 8000
```

### Import Examples

```python
# Using services directly
from services.gemini_service import generate_images, edit_image
from services.imagen_service import upscale_with_google_imagen
from services.auth_service import validate_login

# Using configuration
from config import API_KEY, GEMINI_FLASH_MODEL

# Using models
from models import ImageRequest, GenerateResponse

# Using utilities
from utils import normalize_base64, serialize_inline_image
```

## 📝 Migration Guide

The refactored code is **fully compatible** with the original API:
- Same endpoints
- Same request/response formats
- Same functionality

To switch from `main.py` to `main_refactored.py`:

1. **Update deployment scripts**:
   ```bash
   # Old
   uvicorn main:app
   
   # New
   uvicorn main_refactored:app
   ```

2. **Update imports** (if importing from main.py):
   ```python
   # Old
   from main import app
   
   # New
   from main_refactored import app
   ```

3. **Test thoroughly** to ensure all endpoints work as expected

## 🧪 Testing

The modular structure makes testing easier:

```python
# Test services independently
from services.gemini_service import generate_images

def test_generate_images():
    model, images = generate_images(
        prompt="A sunset over mountains",
        num_images=1
    )
    assert model is not None
    assert len(images) == 1
```

## 📦 Dependencies

Same as original - see `requirements.txt`:
- `fastapi`
- `google-generativeai`
- `google-auth-oauthlib`
- `Pillow`
- `requests`
- `python-dotenv`

## 🔧 Environment Variables

All configured in `config.py`:
- `GEMINI_API_KEY`
- `GOOGLE_CLOUD_PROJECT_ID`
- `GOOGLE_CLOUD_LOCATION`
- `GOOGLE_APPLICATION_CREDENTIALS`
- `AUTH_USERNAME`, `AUTH_PASSWORD`
- `ALLOWED_ORIGINS`

## 🎨 API Endpoints

All original endpoints preserved:

### Generation
- `POST /generate/gemini` - Generate with Gemini
- `POST /generate/imagen` - Generate with Imagen
- `GET /models/imagen` - List models
- `POST /prompt/improve` - Improve prompts
- `POST /segment/gemini` - Image segmentation

### Editing
- `POST /edit/gemini` - Edit with Gemini

### Processing
- `POST /upscale` - Upscale images
- `POST /inpaint` - Inpaint images

### Auth
- `POST /auth/login` - Login
- `GET /auth/vertex/url` - OAuth URL
- `POST /auth/vertex/callback` - OAuth callback
- `GET /auth/vertex/status` - Auth status

### Health
- `GET /health` - Health check

## 💡 Benefits

1. **Easier debugging** - Isolate issues to specific modules
2. **Team collaboration** - Multiple developers can work on different modules
3. **Code reuse** - Services can be imported and used elsewhere
4. **Better IDE support** - Clearer code organization improves autocomplete
5. **Future-proof** - Easy to extend with new features

## 🔄 Next Steps

1. **Test the refactored version** thoroughly
2. **Update deployment** to use `main_refactored.py`
3. **Consider renaming** `main_refactored.py` → `main.py` after validation
4. **Add unit tests** for services
5. **Consider adding** dependency injection for better testability

---

**Note**: The original `main.py` is kept for reference. Once the refactored version is validated, you can rename or remove it.
