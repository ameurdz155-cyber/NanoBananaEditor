# Quick verification script for upscale endpoint integration
# Run this to verify everything is working

Write-Host "================================" -ForegroundColor Cyan
Write-Host "UPSCALE INTEGRATION VERIFICATION" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check Python
Write-Host "[1/4] Checking Python environment..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version 2>&1
    Write-Host "OK: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Python not found" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Check backend server
Write-Host "[2/4] Checking if backend server is running..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:9000/health" -Method GET -TimeoutSec 3 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "OK: Backend server is running" -ForegroundColor Green
    }
} catch {
    Write-Host "WARNING: Backend server is not running" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Starting backend server in new window..." -ForegroundColor Cyan
    
    $scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptPath\gemini_tunnel'; python -m uvicorn main:app --host 127.0.0.1 --port 9000 --reload"
    
    Write-Host "Waiting 5 seconds for server to start..." -ForegroundColor Cyan
    Start-Sleep -Seconds 5
}
Write-Host ""

# Check authentication
Write-Host "[3/4] Checking authentication status..." -ForegroundColor Yellow
try {
    $authResponse = Invoke-RestMethod -Uri "http://127.0.0.1:9000/auth/vertex/status" -Method GET -TimeoutSec 3
    if ($authResponse.authenticated -eq $true) {
        Write-Host "OK: Authentication is configured" -ForegroundColor Green
        if ($authResponse.token_expiry) {
            Write-Host "   Token expires: $($authResponse.token_expiry)" -ForegroundColor Gray
        }
    } else {
        Write-Host "WARNING: Authentication not configured" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "To set up authentication, run:" -ForegroundColor Cyan
        Write-Host "  cd gemini_tunnel\scripts" -ForegroundColor White
        Write-Host "  python generate_auth_token.py" -ForegroundColor White
    }
} catch {
    Write-Host "WARNING: Could not check auth status" -ForegroundColor Yellow
}
Write-Host ""

# Run integration tests
Write-Host "[4/4] Running integration tests..." -ForegroundColor Yellow
Set-Location -Path "gemini_tunnel\scripts"
python test_upscale_frontend_integration.py
Set-Location -Path "..\..\"
Write-Host ""

# Summary
Write-Host "================================" -ForegroundColor Cyan
Write-Host "VERIFICATION COMPLETE" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Green
Write-Host "1. Review the test output above" -ForegroundColor White
Write-Host "2. If tests passed, start frontend: npm run dev" -ForegroundColor White
Write-Host "3. Open browser: http://localhost:5173" -ForegroundColor White
Write-Host "4. Navigate to Upscale section" -ForegroundColor White
Write-Host "5. Upload an image and click 'Upscale x4'" -ForegroundColor White
Write-Host ""

Read-Host "Press Enter to exit"
