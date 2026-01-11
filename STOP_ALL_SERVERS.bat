@echo off
REM ============================================================================
REM WMS - Stop All Servers
REM ============================================================================
REM Stops all Node.js processes (backend and frontend)
REM ============================================================================

echo.
echo ========================================================================
echo   STOPPING ALL WMS SERVERS
echo ========================================================================
echo.

taskkill //F //IM node.exe

if %errorlevel% equ 0 (
    echo.
    echo   All Node.js processes terminated successfully.
    echo   Both backend and frontend servers are now stopped.
) else (
    echo.
    echo   No Node.js processes were running.
)

echo.
echo ========================================================================
echo.
pause
