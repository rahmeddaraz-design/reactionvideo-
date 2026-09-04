@echo off
REM ===================================================
REM     Ahmed Reaction Studio - Windows Launcher
REM ===================================================
echo.
echo ===================================================
echo     Ahmed Reaction Studio (Local-First Edition)
echo ===================================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found in PATH.
    echo Please download and install Node.js (LTS recommended) from:
    echo https://nodejs.org/
    echo.
    pause
    exit /b 1
)

REM Check if dependencies are installed
if not exist "node_modules" (
    echo [INFO] Installing required dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] npm install failed. Check your internet connection.
        pause
        exit /b 1
    )
)

echo.
echo [OK] Dependencies verified.
echo [INFO] Starting Ahmed Reaction Studio local server on port 3000...
echo [INFO] Opening in Google Chrome...
echo.

REM Launch browser in 2 seconds
timeout /t 2 /nobreak >nul
start "" http://localhost:3000

REM Run Vite development server bound to all local interfaces
call npm run dev -- --host 0.0.0.0 --port 3000
pause
