@echo off
REM CyberEdu server restart — portable version (no hardcoded paths)
taskkill /f /im node.exe >nul 2>&1
timeout /t 1 /nobreak >nul
cd /d "%~dp0"
start "CyberEdu Server" cmd /k "node server.js"
echo CyberEdu Server restarting... New window will open on http://localhost:8000
pause
