# Arrowhead Polaris - Warehouse Management System (WMS)

A comprehensive warehouse management system built with React, Express, and Prisma.

## Quick Start

### 🚀 ONE COMMAND TO START EVERYTHING (Recommended)

```bash
npm run dev:all
```

**This command:**
- ✅ Starts Backend API on port 3001
- ✅ Starts Frontend (Vite) on port 5173
- ✅ Validates ports before starting
- ✅ Shows labeled output for each service
- ✅ Requires NO manual directory changes

### Alternative: Master Startup Script

```bash
# From Warehouse-WMS-main directory:
start-wms.bat
```

This script will:
- Check if services are already running
- Start backend on port 3001 (if not running)
- Start frontend on port 5173 (if not running)
- Display URLs for both services

### Option 2: Manual Startup

**Backend:**
```bash
cd Warehouse-WMS-main/backend
node src/server.js
```

**Frontend:**
```bash
cd Warehouse-WMS-main
node node_modules\vite\bin\vite.js --host
```

## Utility Scripts

### Check Service Status
```bash
check-services.bat
```

Displays:
- Whether backend and frontend are running
- Process IDs (PIDs)
- URLs for each service
- Port conflict warnings

### Stop All Services
```bash
stop-services.bat
```

Gracefully stops all WMS services by:
- Finding processes on ports 3001 and 5173
- Terminating them cleanly
- Verifying shutdown

## Application URLs

Once started, access the application at:

- **Frontend (Web Interface):** http://localhost:5173
- **Backend API:** http://localhost:3001/api

## 🚨 Reliable Startup Guide

### ONE COMMAND TO START EVERYTHING:
```bash
npm run dev:all
```

### WHAT NOT TO DO:
- ❌ **Do NOT use `npm run dev:all` before reading this guide** (old broken script)
- ❌ **Do NOT run `npm run dev` without checking if port 5173 is free**
- ❌ **Do NOT run commands from subdirectories** (e.g., `cd frontend` or `cd backend`)
- ❌ **Do NOT use `npx vite` directly** - it may run from wrong directory
- ❌ **Do NOT assume ports are free** - always check first

### RECOVERY IF SERVICES WON'T START:
1. **Check system readiness:**
   ```bash
   npm run preflight
   ```
   This validates Node version, ports, and environment files.

2. **Clear ports if needed:**
   ```bash
   stop-services.bat
   ```

3. **Try validated startup:**
   ```bash
   npm run start:safe
   ```
   This runs pre-flight checks before starting services.

### EXPECTED OUTPUT WHEN WORKING:
```
[BACKEND]
2026-01-07 20:30:00 [info]: Setting up cron jobs...
2026-01-07 20:30:00 [info]: Cron jobs setup complete (skipped - job files not created yet)
╔═════════════════════════════════════════════════════════╗
║                                                               ║
║   🏭 OpsUI Backend Server Running                           ║
║                                                               ║
║   📍 Environment: development                           ║
║   🌐 Port: 3001                                                   ║
║   🔗 API: http://localhost:3001/api                       ║
║                                                               ║
╚═══════════════════════════════════════════════════════════╝

✅ Database connected successfully

[FRONTEND]
  VITE v5.0.0  ready in 234 ms
  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.1.100:5173/
```

### COMMON FAILURE CAUSES:

#### 1. Port 5173 Already in Use
**Symptom:** `Error: Port 5173 is already in use`
**Cause:** Previous Vite instance still running
**Fix:**
```bash
# Check what's using the port
netstat -aon | findstr :5173

# Kill the process
taskkill /F /PID <process_id>

# Or use the stop script
stop-services.bat
```

#### 2. Wrong Directory
**Symptom:** 404 errors, "File not found", or empty page
**Cause:** Vite started from wrong directory (e.g., `wms-test/` instead of `wms-test/Warehouse-WMS-main/`)
**Fix:**
- Always run from: `c:\Users\Heinricht\Downloads\wms-test\Warehouse-WMS-main\`
- Use: `npm run dev:all` (handles directories automatically)
- Or use VS Code task: "Start Full Stack"

#### 3. Node Version Mismatch
**Symptom:** `SyntaxError: Unexpected token` or `Module not found` errors
**Cause:** Node.js version < 18
**Fix:**
```bash
# Check your version
node --version

# Must be 18.0.0 or higher
# Download from: https://nodejs.org/
```

#### 4. Missing Environment Files
**Symptom:** `Error: ENOENT: no such file or directory`
**Cause:** backend/.env missing
**Fix:**
```bash
# Copy example to actual file
copy Warehouse-WMS-main\backend\.env.example Warehouse-WMS-main\backend\.env

# Edit with your values
notepad Warehouse-WMS-main\backend\.env
```

#### 5. Missing Dependencies
**Symptom:** `Error: Cannot find module 'vite'` or similar
**Cause:** node_modules not installed
**Fix:**
```bash
# Install all dependencies
cd Warehouse-WMS-main
npm install

cd Warehouse-WMS-main/backend
npm install
```

#### 6. JSX Syntax Errors
**Symptom:** `Failed to parse source for import analysis because content contains invalid JS syntax`
**Cause:** .jsx files have .js extension
**Fix:**
- Files should be renamed from .js to .jsx
- Or add /* @jsxImportSource react */ pragma
- This is fixed automatically in current version

### VS Code Shortcuts (IDE Integration)

Open VS Code and press:
- **Ctrl+Shift+B** (or **F1**) → Opens task list
- Select "Start Full Stack (Recommended)" to start everything
- Tasks run from correct directory automatically
- No need to remember commands

### Pre-flight Check Script

Before starting services, run:
```bash
npm run preflight
```

This validates:
- ✅ Node.js version (18+ required)
- ✅ Port 3001 availability
- ✅ Port 5173 availability
- ✅ Environment files exist
- ✅ Dependencies installed
- ✅ Database accessible

**Exit code 0 = All checks passed**
**Exit code 1 = Fix errors before starting**

## Troubleshooting

### Services won't start
1. Run `npm run preflight` to validate system
2. Run `check-services.bat` to see what's running
3. If ports are occupied, run `stop-services.bat`
4. Restart with `npm run dev:all`

### Frontend shows 404 errors
- **Issue:** Vite running from wrong directory
- **Solution:** Use `npm run dev:all` which ensures correct working directory
- **Manual fix:** Always run Vite from `Warehouse-WMS-main` directory

### Port conflicts
If you see "Port already in use" errors:
1. Run `check-services.bat` to find process ID
2. Use `stop-services.bat` to clear ports
3. Or manually kill process: `taskkill /F /PID <process_id>`

### Services stop unexpectedly
- Check backend logs: `backend/logs/`
- Verify database connection in backend/.env
- Ensure node_modules are installed: `npm install`

## Project Structure

```
Warehouse-WMS-main/
├── backend/              # Express API server
│   ├── src/
│   │   ├── server.js
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── services/
│   │   └── middleware/
│   ├── .env             # Backend environment variables
│   └── package.json
├── src/                 # React frontend
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   └── services/
├── prisma/              # Database schema & migrations
├── start-wms.bat       # Master startup script ⭐
├── check-services.bat   # Service status checker
├── stop-services.bat    # Service stop script
└── package.json
```

## Development

### Install Dependencies
```bash
# Backend
cd Warehouse-WMS-main/backend
npm install

# Frontend
cd Warehouse-WMS-main
npm install
```

### Database Setup
```bash
cd Warehouse-WMS-main
npx prisma generate
npx prisma db push
```

## Environment Variables

Backend (Warehouse-WMS-main/backend/.env):
- PORT=3001
- DATABASE_URL
- JWT_SECRET
- etc.

Frontend (Warehouse-WMS-main/.env):
- VITE_API_URL=http://localhost:3001/api

## Technology Stack

- **Frontend:** React 18, Vite, TailwindCSS
- **Backend:** Express.js, Node.js
- **Database:** SQLite (Prisma ORM)
- **Auth:** JWT, bcrypt
- **API:** RESTful API design

## License

UNLICENSED