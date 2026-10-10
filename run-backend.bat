@echo off
REM Tirunelveli Virtual Kural - starts the Spring Boot API on http://localhost:8080
setlocal

cd /d "%~dp0backend"

where mvn >nul 2>nul
if errorlevel 1 (
    echo.
    echo [ERROR] Maven was not found on your PATH.
    echo         Install Apache Maven 3.9+ and open a NEW Command Prompt, then run this again.
    echo.
    pause
    exit /b 1
)

where java >nul 2>nul
if errorlevel 1 (
    echo.
    echo [ERROR] Java was not found on your PATH.
    echo         Install a JDK 17 or newer and open a NEW Command Prompt, then run this again.
    echo.
    pause
    exit /b 1
)

echo.
echo ===============================================================
echo  Tirunelveli Virtual Kural - API
echo  The first run downloads dependencies and seeds 9999 citizens
echo  plus 7 officers. This can take a few minutes.
echo.
echo  API      : http://localhost:8080/api
echo  Database : MySQL localhost:3306 / tirunelveli_virtual_kural
echo  (MySQL server must be running - edit backend\src\main\resources\application.properties for user/password)
echo.
echo  Leave this window OPEN, then run run-frontend.bat.
echo ===============================================================
echo.

mvn spring-boot:run

pause
