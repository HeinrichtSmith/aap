@echo off
REM ============================================================================
REM WMS - Stop All Servers (Enhanced)
REM ============================================================================
REM This script properly stops all WMS servers and cleans up resources
REM Designed for AI assistants (GLM, Claude, etc.) to reliably stop services
REM ============================================================================

setlocal enabledelayedexpansion

echo.
echo ========================================================================
echo   STOPPING ALL WMS SERVERS AND CLEANING UP
echo ========================================================================
echo.

REM Step 1: Try graceful shutdown on specific ports first
echo [1/4] Attempting graceful shutdown on ports 3001 and 5173...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001.*LISTENING"') do (
    echo   - Terminating process %%a (Backend on port 3001)
    taskkill //F //PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5173.*LISTENING"') do (
    echo   - Terminating process %%a (Frontend on port 5173)
    taskkill //F //PID %%a >nul 2>&1
)

REM Step 2: Kill all Node.exe processes as fallback
echo.
echo [2/4] Terminating any remaining Node.js processes...
taskkill //F //IM node.exe >nul 2>&1

REM Step 3: Wait a moment for processes to fully terminate
echo.
echo [3/4] Waiting for processes to terminate...
timeout /t 2 /nobreak >nul

REM Step 4: Verify cleanup
echo.
echo [4/4] Verifying cleanup...
set "BACKEND_RUNNING=0"
set "FRONTEND_RUNNING=0"

for /f %%a in ('netstat -ano ^| findstr ":3001.*LISTENING" ^| find /c /v ""') do set "BACKEND_RUNNING=%%a"
for /f %%a in ('netstat -ano ^| findstr ":5173.*LISTENING" ^| find /c /v ""') do set "FRONTEND_RUNNING=%%a"

if !BACKEND_RUNNING! equ 0 (
    if !FRONTEND_RUNNING! equ 0 (
        echo   All servers stopped successfully
    ) else (
        echo   Warning: Frontend may still be running on port 5173
    )
) else (
    echo   Warning: Backend may still be running on port 3001
)

echo.
echo ========================================================================
echo   CLEANUP COMPLETE
echo ========================================================================
echo.
echo Servers are now stopped. You can restart them with:
echo   npm start
echo.
endlocal
