from dotenv import load_dotenv
import os
import google.generativeai as genai

load_dotenv()
API_KEY = os.getenv('GEMINI_API_KEY')
if not API_KEY:
    print('NO_API_KEY')
    raise SystemExit(1)

genai.configure(api_key=API_KEY)

try:
    models = genai.list_models()
    for m in models:
        try:
            print(getattr(m, 'name', m))
        except Exception:
            print(m)
except Exception as e:
    print('LIST_MODELS_FAILED:', e)
    raise
