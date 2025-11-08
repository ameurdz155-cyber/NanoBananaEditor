@echo off
REM Quick verification script for upscale endpoint integration
REM Run this to verify everything is working

echo ================================
echo UPSCALE INTEGRATION VERIFICATION
echo ================================
echo.

echo [1/4] Checking Python environment...
python --version
if errorlevel 1 (
    echo ERROR: Python not found
    pause
    exit /b 1
)
echo OK: Python is installed
echo.

echo [2/4] Checking if backend server is running...
curl -s http://127.0.0.1:9000/health >nul 2>&1
if errorlevel 1 (
    echo WARNING: Backend server is not running
    echo.
    echo Starting backend server in new window...
    start "Gemini Tunnel Backend" cmd /k "cd gemini_tunnel && python -m uvicorn main:app --host 127.0.0.1 --port 9000 --reload"
    echo.
    echo Waiting 5 seconds for server to start...
    timeout /t 5 /nobreak >nul
) else (
    echo OK: Backend server is running
)
echo.

echo [3/4] Checking authentication status...
cd gemini_tunnel\scripts
python -c "import requests; r = requests.get('http://127.0.0.1:9000/auth/vertex/status'); print('AUTH:', 'OK' if r.json().get('authenticated') else 'NOT CONFIGURED')"
if errorlevel 1 (
    echo WARNING: Could not check auth status
    echo.
    echo To set up authentication, run:
    echo   cd gemini_tunnel\scripts
    echo   python generate_auth_token.py
)
echo.

echo [4/4] Running integration tests...
python test_upscale_frontend_integration.py
echo.

echo ================================
echo VERIFICATION COMPLETE
echo ================================
echo.
echo Next steps:
echo 1. Review the test output above
echo 2. If tests passed, start frontend: npm run dev
echo 3. Open browser: http://localhost:5173
echo 4. Navigate to Upscale section
echo 5. Upload an image and click "Upscale x4"
echo.
pause
