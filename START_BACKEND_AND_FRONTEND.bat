@echo off
REM ============================================================================
REM WMS - Start Backend and Frontend Servers
REM ============================================================================
REM This script starts both the backend API server and the frontend dev server
REM Optimized for GLM 4.5 and other AI assistants to execute
REM ============================================================================

echo.
echo ========================================================================
echo   WAREHOUSE MANAGEMENT SYSTEM - STARTING SERVERS
echo ========================================================================
echo.

REM Kill any existing Node processes
echo [1/4] Cleaning up existing processes...
taskkill //F //IM node.exe >nul 2>&1
if %errorlevel% equ 0 (
    echo   - Stopped existing Node processes
) else (
    echo   - No existing processes found
)
echo.

REM Start Backend Server
echo [2/4] Starting Backend API Server...
cd /d "%~dp0backend"
start "WMS Backend" cmd /k "npm start"
echo   - Backend starting on http://localhost:3001
echo.

REM Wait for backend to initialize
echo [3/4] Waiting for backend to initialize...
timeout /t 3 /nobreak >nul
echo   - Backend should be ready
echo.

REM Start Frontend Server
echo [4/4] Starting Frontend Dev Server...
cd /d "%~dp0"
start "WMS Frontend" cmd /k "npm run dev"
echo   - Frontend starting on http://localhost:5173
echo.

echo ========================================================================
echo   SERVERS STARTED SUCCESSFULLY
echo ========================================================================
echo.
echo   Frontend: http://localhost:5173/
echo   Backend:  http://localhost:3001/api
echo.
echo   Press any key to open the application in your browser...
pause >nul

REM Open in browser
start http://localhost:5173/

echo.
echo Application opened in default browser.
echo.
echo To stop all servers, run: STOP_ALL_SERVERS.bat
echo.
