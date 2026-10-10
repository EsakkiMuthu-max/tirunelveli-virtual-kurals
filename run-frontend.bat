@echo off
REM Tirunelveli Virtual Kural - installs and starts the web UI on http://localhost:3000
setlocal

cd /d "%~dp0frontend"

where npm >nul 2>nul
if errorlevel 1 (
    echo.
    echo [ERROR] Node.js / npm was not found on your PATH.
    echo         Install Node.js 20+ and open a NEW Command Prompt, then run this again.
    echo.
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo.
    echo Installing frontend dependencies ^(first run only^)...
    echo.
    call npm install
    if errorlevel 1 (
        echo.
        echo [ERROR] npm install failed. Check your network or proxy settings.
        echo.
        pause
        exit /b 1
    )
)

echo.
echo ===============================================================
echo  Tirunelveli Virtual Kural - Web UI
echo.
echo  Open http://localhost:3000 in your browser.
echo.
echo  Citizen : TVK0001 ... TVK9999  password citizen@123
echo  Officer : officer1 ... officer7 password officer@123
echo.
echo  The API ^(run-backend.bat^) must already be running on port 8080.
echo ===============================================================
echo.

call npm run dev

pause
