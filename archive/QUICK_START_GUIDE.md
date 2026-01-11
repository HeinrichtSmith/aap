# Quick Start Guide - Preventing Server Startup Issues

## The Problem: "Backwards and Forwards"

When servers don't start correctly, you might try many commands that don't work, leading to:
- Port conflicts (multiple processes on same port)
- Wrong directory issues (Vite can't find files)
- Confusion about what's actually running

## The Solution: Use the Master Startup Script

### To Start Everything (Correct Way):
```bash
cd Warehouse-WMS-main
start-wms.bat
```

**Why this works:**
- ✅ Automatically checks if services are already running
- ✅ Runs from correct directory (prevents 404 errors)
- ✅ Shows clear status messages
- ✅ No port conflicts

### To Check What's Running:
```bash
cd Warehouse-WMS-main
check-services.bat
```

### To Stop Everything:
```bash
cd Warehouse-WMS-main
stop-services.bat
```

## Common Issues & Solutions

### Issue: "Port already in use"
**Solution:** Run `stop-services.bat` then `start-wms.bat`

### Issue: "404 errors" in browser
**Solution:** Use `start-wms.bat` (it ensures Vite runs from correct directory)

### Issue: "Services start but don't respond"
**Solution:** 
1. Run `check-services.bat`
2. Check if correct ports are showing (3001 for backend, 5173 for frontend)
3. If wrong, run `stop-services.bat` and restart

### Issue: Multiple terminals open
**Solution:** 
1. Close all Node.js terminals
2. Run `stop-services.bat` to kill any remaining processes
3. Run `start-wms.bat` to start fresh

## Command Reference

| What You Want | Command | Location |
|---------------|-----------|-----------|
| Start all services | `start-wms.bat` | Warehouse-WMS-main |
| Check status | `check-services.bat` | Warehouse-WMS-main |
| Stop all services | `stop-services.bat` | Warehouse-WMS-main |
| Backend only | `node backend/src/server.js` | Warehouse-WMS-main |
| Frontend only | `node node_modules\vite\bin\vite.js --host` | Warehouse-WMS-main |

## Pro Tips

1. **Always run from Warehouse-WMS-main directory**
   - This is the root of the project
   - Vite needs this to find files correctly

2. **Use start-wms.bat for normal startup**
   - It's the most reliable method
   - Handles all edge cases automatically

3. **Check status before starting**
   - Run `check-services.bat` first
   - Prevents confusion about what's running

4. **Stop services completely before troubleshooting**
   - Run `stop-services.bat`
   - Then `check-services.bat` to verify everything stopped
   - Then restart with `start-wms.bat`

## What Not To Do

❌ **Don't** manually kill processes by PID unless you know it's safe
❌ **Don't** run Vite from wrong directory (e.g., from wms-test root)
❌ **Don't** start multiple instances of same service
❌ **Don't** guess if something is running - use `check-services.bat`

## When To Use Claude/AI

Use the startup scripts first before asking for help:
1. Try `stop-services.bat`
2. Try `start-wms.bat`
3. Run `check-services.bat` to verify
4. **Then** share the output if issues persist

This prevents the "backwards and forwards" cycle!