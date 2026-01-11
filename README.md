# WMS Test Project

## Quick Start

### For Claude/GPT/AI Assistants (from root directory)
```bash
npm start
```
This runs START_BACKEND_AND_FRONTEND.bat which:
- Stops any existing Node processes
- Starts backend on port 3001
- Starts frontend on port 5173
- Opens browser automatically

### Alternative (from project folder)
1. Navigate to: `Warehouse-WMS-main/`
2. Run: `START_BACKEND_AND_FRONTEND.bat`
3. Application opens at: http://localhost:5173

### To Stop All Servers
```bash
npm stop
```
Or: `Warehouse-WMS-main/STOP_ALL_SERVERS.bat`

---

## Project Structure

```
wms-test/
├── Warehouse-WMS-main/         # ACTIVE PROJECT (use this)
├── archive/                    # Archived old files
├── CREATE_BACKUP.bat           # Backup script (creates in ../WMS-Backups/)
├── CLEANUP_ROOT_DIRECTORY.bat  # Cleanup script
├── package.json                # NPM scripts configured
└── README.md                   # This file

Backups stored in: C:\Users\Heinricht\Downloads\WMS-Backups\
```

---

## Important Files

### GLM Navigation Guide
`Warehouse-WMS-main/GLM_NAVIGATION_GUIDE.md` - Essential reading for AI assistants

### Startup Scripts
- `START_BACKEND_AND_FRONTEND.bat` - Start both servers (GLM optimized)
- `STOP_ALL_SERVERS.bat` - Stop all Node processes

### Main Project
- Frontend: React + Vite
- Backend: Node.js + Express
- Database: SQLite (via Prisma)

---

## Server URLs

- **Frontend**: http://localhost:5173/
- **Backend API**: http://localhost:3001/api

---

## Common Tasks

### Start the Application
```bash
npm start
```

### Stop the Application
```bash
npm stop
```

### Development Mode
```bash
npm run dev
```

### Clean Up Root Directory
```bash
CLEANUP_ROOT_DIRECTORY.bat
```

### Create Backup
```bash
npm run backup
```

---

## AI Assistant Notes

### For GLM 4.5
- Run `npm start` from root directory
- Read `GLM_NAVIGATION_GUIDE.md` for file locations
- Both servers start in background windows
- All npm scripts configured in package.json

### For Claude
- Can run both servers with `npm start`
- See Navigation Guide for component locations
- Can use any npm script from root

### Troubleshooting
- Port 3001 already in use? Run `npm stop` first
- Build errors? Check JSX syntax in error file
- Backend not starting? Check `backend/.env` configuration

---

## Project Status

- ✅ All UI issues fixed (Order IDs, GameIcons, Card heights)
- ✅ JSX structure errors resolved
- ✅ Backend API integrated
- ✅ Application builds successfully
- ✅ NPM scripts configured
- ✅ Pushed to GitHub: https://github.com/HeinrichtSmith/aap.git

---

## Last Updated
2025-01-12
