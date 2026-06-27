@echo off
cd /d "%~dp0"
echo ============================================
echo   GeoSentinel - Starting local server
echo   Open http://localhost:8000 in browser
echo   Press Ctrl+C to stop
echo ============================================
echo.
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
pause