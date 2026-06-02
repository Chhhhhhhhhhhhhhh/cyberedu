@echo off
taskkill /f /im node.exe >nul 2>&1
timeout /t 1 /nobreak >nul
cd /d F:\workspace
start "CyberEdu Server" cmd /k "C:\Users\19870\.workbuddy\binaries\node\versions\22.22.2\node.exe server.js"
echo CyberEdu Server v2.1 restarting... New window will open.
pause
