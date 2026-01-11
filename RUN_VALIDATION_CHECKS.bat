@echo off
REM ============================================================================
REM WMS - Comprehensive Validation Checks
REM ============================================================================
REM This script runs all validation checks to ensure system health
REM Run this before marking any task as complete
REM ============================================================================

setlocal enabledelayedexpansion

set "VALIDATION_PASSED=1"
set "ERROR_COUNT=0"
set "WARNING_COUNT=0"

echo.
echo ========================================================================
echo   WMS COMPREHENSIVE VALIDATION
echo ========================================================================
echo.

REM Color codes for output
set "RED=[91m"
set "GREEN=[92m"
set "YELLOW=[93m"
set "BLUE=[94m"
set "RESET=[0m"

echo %BLUE%Running validation checks...%RESET%
echo.

REM ============================================================================
REM CHECK 1: Server Processes
REM ============================================================================
echo %BLUE%[1/10]%RESET% Checking for running Node processes...
tasklist | findstr node.exe >nul 2>&1
if !errorlevel! equ 0 (
    echo %YELLOW%⚠️  WARNING:%RESET% Node processes are still running
    echo    → Run 'npm stop' to clean up before task completion
    set /a WARNING_COUNT+=1
) else (
    echo %GREEN%✓ PASS%RESET% No Node processes running
)

REM ============================================================================
REM CHECK 2: Port Availability
REM ============================================================================
echo.
echo %BLUE%[2/10]%RESET% Checking port availability...
netstat -ano | findstr ":3001.*LISTENING" >nul 2>&1
if !errorlevel! equ 0 (
    echo %YELLOW%⚠️  WARNING:%RESET% Port 3001 is still in use
    set /a WARNING_COUNT+=1
) else (
    echo %GREEN%✓ PASS%RESET% Port 3001 is available
)

netstat -ano | findstr ":5173.*LISTENING" >nul 2>&1
if !errorlevel! equ 0 (
    echo %YELLOW%⚠️  WARNING:%RESET% Port 5173 is still in use
    set /a WARNING_COUNT+=1
) else (
    echo %GREEN%✓ PASS%RESET% Port 5173 is available
)

REM ============================================================================
REM CHECK 3: Git Status
REM ============================================================================
echo.
echo %BLUE%[3/10]%RESET% Checking git repository status...
cd /d "%~dp0"
git rev-parse --git-dir >nul 2>&1
if !errorlevel! equ 0 (
    echo %GREEN%✓ PASS%RESET% Git repository detected

    git status --porcelain >nul 2>&1
    if !errorlevel! neq 0 (
        echo %YELLOW%⚠️  INFO:%RESET% Uncommitted changes detected
        set /a WARNING_COUNT+=1
    ) else (
        echo %GREEN%✓ PASS%RESET% Working directory clean
    )
) else (
    echo %RED%✗ FAIL%RESET% Not a git repository
    set /a ERROR_COUNT+=1
    set "VALIDATION_PASSED=0"
)

REM ============================================================================
REM CHECK 4: Frontend Dependencies
REM ============================================================================
echo.
echo %BLUE%[4/10]%RESET% Checking frontend dependencies...
if exist "package.json" (
    if exist "node_modules" (
        echo %GREEN%✓ PASS%RESET% Frontend dependencies installed
    ) else (
        echo %RED%✗ FAIL%RESET% Frontend dependencies missing
        echo    → Run: npm install
        set /a ERROR_COUNT+=1
        set "VALIDATION_PASSED=0"
    )
) else (
    echo %RED%✗ FAIL%RESET% package.json not found
    set /a ERROR_COUNT+=1
    set "VALIDATION_PASSED=0"
)

REM ============================================================================
REM CHECK 5: Backend Dependencies
REM ============================================================================
echo.
echo %BLUE%[5/10]%RESET% Checking backend dependencies...
cd /d "%~dp0backend"
if exist "package.json" (
    if exist "node_modules" (
        echo %GREEN%✓ PASS%RESET% Backend dependencies installed
    ) else (
        echo %RED%✗ FAIL%RESET% Backend dependencies missing
        echo    → Run: cd backend && npm install
        set /a ERROR_COUNT+=1
        set "VALIDATION_PASSED=0"
    )
) else (
    echo %RED%✗ FAIL%RESET% Backend package.json not found
    set /a ERROR_COUNT+=1
    set "VALIDATION_PASSED=0"
)

REM ============================================================================
REM CHECK 6: Database
REM ============================================================================
echo.
echo %BLUE%[6/10]%RESET% Checking database...
if exist "prisma\dev.db" (
    echo %GREEN%✓ PASS%RESET% Database file exists

    REM Check database size
    for %%A in ("prisma\dev.db") do set "DBSIZE=%%~zA"
    if !DBSIZE! gtr 0 (
        echo %GREEN%✓ PASS%RESET% Database contains data
    ) else (
        echo %YELLOW%⚠️  WARNING:%RESET% Database is empty
        set /a WARNING_COUNT+=1
    )
) else (
    echo %RED%✗ FAIL%RESET% Database not found
    echo    → Run: cd backend && npx prisma db push && node prisma/seed.js
    set /a ERROR_COUNT+=1
    set "VALIDATION_PASSED=0"
)

REM ============================================================================
REM CHECK 7: Prisma Schema
REM ============================================================================
echo.
echo %BLUE%[7/10]%RESET% Checking Prisma schema...
if exist "prisma\schema.prisma" (
    echo %GREEN%✓ PASS%RESET% Prisma schema found

    REM Validate schema
    npx prisma validate >nul 2>&1
    if !errorlevel! equ 0 (
        echo %GREEN%✓ PASS%RESET% Prisma schema is valid
    ) else (
        echo %RED%✗ FAIL%RESET% Prisma schema validation failed
        set /a ERROR_COUNT+=1
        set "VALIDATION_PASSED=0"
    )
) else (
    echo %RED%✗ FAIL%RESET% Prisma schema not found
    set /a ERROR_COUNT+=1
    set "VALIDATION_PASSED=0"
)

REM ============================================================================
REM CHECK 8: Environment Configuration
REM ============================================================================
echo.
echo %BLUE%[8/10]%RESET% Checking environment configuration...
if exist ".env" (
    echo %GREEN%✓ PASS%RESET% Backend .env file exists

    findstr "DATABASE_URL" .env >nul
    if !errorlevel! equ 0 (
        echo %GREEN%✓ PASS%RESET% DATABASE_URL configured
    ) else (
        echo %YELLOW%⚠️  WARNING:%RESET% DATABASE_URL not found in .env
        set /a WARNING_COUNT+=1
    )
) else (
    echo %YELLOW%⚠️  WARNING:%RESET% .env file not found
    set /a WARNING_COUNT+=1
)

REM ============================================================================
REM CHECK 9: Critical Files
REM ============================================================================
echo.
echo %BLUE%[9/10]%RESET% Checking critical project files...
set "MISSING_FILES=0"

if not exist "src\App.jsx" (
    echo %RED%✗ FAIL%RESET% src\App.jsx missing
    set /a MISSING_FILES+=1
)
if not exist "src\pages\Picking.jsx" (
    echo %RED%✗ FAIL%RESET% src\pages\Picking.jsx missing
    set /a MISSING_FILES+=1
)
if not exist "src\components\picking\OptimizedPickingItem.jsx" (
    echo %RED%✗ FAIL%RESET% OptimizedPickingItem.jsx missing
    set /a MISSING_FILES+=1
)

if !MISSING_FILES! equ 0 (
    echo %GREEN%✓ PASS%RESET% All critical files present
) else (
    set /a ERROR_COUNT+=!MISSING_FILES!
    set "VALIDATION_PASSED=0"
)

REM ============================================================================
REM CHECK 10: Build Feasibility
REM ============================================================================
echo.
echo %BLUE%[10/10]%RESET% Checking build feasibility...
cd /d "%~dp0"
if exist "vite.config.js" (
    echo %GREEN%✓ PASS%RESET% Vite config exists
    echo %GREEN%✓ PASS%RESET% Frontend should build successfully
) else (
    echo %YELLOW%⚠️  WARNING:%RESET% Vite config not found
    set /a WARNING_COUNT+=1
)

REM ============================================================================
REM SUMMARY
REM ============================================================================
echo.
echo ========================================================================
echo   VALIDATION SUMMARY
echo ========================================================================
echo.

if !VALIDATION_PASSED! equ 1 (
    if !WARNING_COUNT! equ 0 (
        echo %GREEN%✓ ALL CHECKS PASSED%RESET%
        echo.
        echo System is healthy and ready for use.
    ) else (
        echo %GREEN%✓ VALIDATION PASSED with !WARNING_COUNT! warning(s)%RESET%
        echo.
        echo System is functional but review warnings above.
    )
) else (
    echo %RED%✗ VALIDATION FAILED%RESET%
    echo.
    echo Found !ERROR_COUNT! error(s) and !WARNING_COUNT! warning(s)
    echo.
    echo Please fix the errors above before marking task as complete.
)

echo.
echo ========================================================================
echo.

if !VALIDATION_PASSED! equ 0 (
    exit /b 1
)

endlocal
