@echo off
REM ============================================================================
REM WMS - Auto-Fix Common Issues
REM ============================================================================
REM This script automatically detects and fixes common WMS issues
REM Run this when experiencing problems
REM ============================================================================

setlocal enabledelayedexpansion

set "ISSUES_FIXED=0"
set "ISSUES_FOUND=0"

echo.
echo ========================================================================
echo   WMS AUTO-FIX AND REPAIR
echo ========================================================================
echo.

REM ============================================================================
REM FIX 1: Stop All Node Processes
REM ============================================================================
echo [1/8] Stopping all Node processes...
tasklist | findstr node.exe >nul 2>&1
if !errorlevel! equ 0 (
    echo   → Found running Node processes, stopping...
    taskkill //F //IM node.exe >nul 2>&1
    timeout /t 2 /nobreak >nul
    echo   ✓ Fixed: All Node processes stopped
    set /a ISSUES_FIXED+=1
) else (
    echo   ✓ OK: No Node processes running
)

REM ============================================================================
REM FIX 2: Install Frontend Dependencies
REM ============================================================================
echo.
echo [2/8] Checking frontend dependencies...
cd /d "%~dp0"
if not exist "node_modules" (
    echo   → Installing frontend dependencies...
    call npm install --silent
    if !errorlevel! equ 0 (
        echo   ✓ Fixed: Frontend dependencies installed
        set /a ISSUES_FIXED+=1
    ) else (
        echo   ✗ Failed to install frontend dependencies
        set /a ISSUES_FOUND+=1
    )
) else (
    echo   ✓ OK: Frontend dependencies exist
)

REM ============================================================================
REM FIX 3: Install Backend Dependencies
REM ============================================================================
echo.
echo [3/8] Checking backend dependencies...
cd /d "%~dp0backend"
if not exist "node_modules" (
    echo   → Installing backend dependencies...
    call npm install --silent
    if !errorlevel! equ 0 (
        echo   ✓ Fixed: Backend dependencies installed
        set /a ISSUES_FIXED+=1
    ) else (
        echo   ✗ Failed to install backend dependencies
        set /a ISSUES_FOUND+=1
    )
) else (
    echo   ✓ OK: Backend dependencies exist
)

REM ============================================================================
REM FIX 4: Create/Update Database
REM ============================================================================
echo.
echo [4/8] Checking database...
cd /d "%~dp0backend"
if not exist "prisma\dev.db" (
    echo   → Creating database...
    call npx prisma db push >nul 2>&1
    if !errorlevel! equ 0 (
        echo   ✓ Fixed: Database created
        set /a ISSUES_FIXED+=1
    ) else (
        echo   ✗ Failed to create database
        set /a ISSUES_FOUND+=1
    )
) else (
    echo   ✓ OK: Database exists
)

REM ============================================================================
REM FIX 5: Generate Prisma Client
REM ============================================================================
echo.
echo [5/8] Checking Prisma client...
cd /d "%~dp0backend"
if not exist "node_modules\.prisma\client" (
    echo   → Generating Prisma client...
    call npx prisma generate >nul 2>&1
    if !errorlevel! equ 0 (
        echo   ✓ Fixed: Prisma client generated
        set /a ISSUES_FIXED+=1
    ) else (
        echo   ✗ Failed to generate Prisma client
        set /a ISSUES_FOUND+=1
    )
) else (
    echo   ✓ OK: Prisma client exists
)

REM ============================================================================
REM FIX 6: Check and Seed Database
REM ============================================================================
echo.
echo [6/8] Checking database data...
cd /d "%~dp0backend"
REM Quick check if database has data
npx prisma db execute --stdin --url "file:./dev.db" >nul 2>&1 <<EOF
SELECT COUNT(*) FROM users;
EOF
if !errorlevel! neq 0 (
    echo   → Seeding database with test data...
    call node prisma/seed.js >nul 2>&1
    if !errorlevel! equ 0 (
        echo   ✓ Fixed: Database seeded
        set /a ISSUES_FIXED+=1
    ) else (
        echo   ⚠️  Warning: Could not seed database (may already have data)
    )
) else (
    echo   ✓ OK: Database contains data
)

REM ============================================================================
REM FIX 7: Clean Lock Files
REM ============================================================================
echo.
echo [7/8] Cleaning lock files...
cd /d "%~dp0"
if exist "package-lock.json" (
    echo   → package-lock.json exists
)

cd /d "%~dp0backend"
if exist "package-lock.json" (
    echo   → backend/package-lock.json exists
)

echo   ✓ Lock files checked

REM ============================================================================
REM FIX 8: Git Repository Check
REM ============================================================================
echo.
echo [8/8] Checking git repository...
cd /d "%~dp0"
git rev-parse --git-dir >nul 2>&1
if !errorlevel! neq 0 (
    echo   → Initializing git repository...
    call git init
    if !errorlevel! equ 0 (
        echo   ✓ Fixed: Git repository initialized
        set /a ISSUES_FIXED+=1
    )
) else (
    echo   ✓ OK: Git repository exists
)

REM ============================================================================
REM SUMMARY
REM ============================================================================
echo.
echo ========================================================================
echo   AUTO-FIX SUMMARY
echo ========================================================================
echo.

if !ISSUES_FIXED! equ 0 (
    if !ISSUES_FOUND! equ 0 (
        echo ✓ No issues found - System is healthy!
    ) else (
        echo ⚠️  Found !ISSUES_FOUND! issue(s) that couldn't be auto-fixed
        echo    Please review the errors above and fix manually
    )
) else (
    echo ✓ Fixed !ISSUES_FIXED! issue(s)
    if !ISSUES_FOUND! gtr 0 (
        echo.
        echo ⚠️  Warning: !ISSUES_FOUND! issue(s) couldn't be fixed
    )
)

echo.
echo ========================================================================
echo.

if !ISSUES_FOUND! gtr 0 (
    echo System may need manual intervention. Please check:
    echo   - Internet connection (for npm install)
    echo   - Node.js installation
    echo   - File permissions
    echo.
)

pause
