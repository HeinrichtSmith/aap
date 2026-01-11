@echo off
REM ============================================================================
REM WMS - Clean Restart
REM ============================================================================
REM This script stops all servers, waits for cleanup, then restarts them
REM Designed for AI assistants to reliably restart the application
REM ============================================================================

setlocal enabledelayedexpansion

echo.
echo ========================================================================
echo   WMS CLEAN RESTART
echo ========================================================================
echo.

REM Step 1: Stop all servers
echo [1/3] Stopping all servers...
taskkill //F //IM node.exe >nul 2>&1

REM Step 2: Wait for cleanup
echo [2/3] Waiting for ports to be released...
timeout /t 3 /nobreak >nul

REM Step 3: Start servers
echo [3/3] Starting servers...
echo.
cd /d "%~dp0"
call START_BACKEND_AND_FRONTEND.bat

echo.
echo ========================================================================
echo   RESTART COMPLETE
echo ========================================================================
echo.
endlocal
