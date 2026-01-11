# WMS Server Restart Guide

## Overview

This document explains the reliable, automatic restart workflow for the WMS application. This system ensures clean state after every task completion, preventing stale state, ghost processes, and port conflicts.

---

## Root Cause: Why Servers Persist

### The Problem

Previously, when a task was completed (feature fix, refactor, migration):

1. **Existing servers kept running** - No automatic cleanup
2. **New runs started on top** - Duplicate servers on same ports
3. **Manual intervention required** - Developers had to manually Ctrl+C
4. **Hot reload assumptions** - Backend state changes required full restart

### Symptoms

- Stale state in backend
- Ghost processes consuming resources
- "Port already in use" errors
- Inconsistent behavior until manual restart
- "Works only after restart" bugs

---

## Solution: Authoritative Restart Workflow

### Architecture

**Single Source of Truth**: `restart-all.bat`

This script enforces a clean restart boundary every time:
1. Stops all existing services (aggressively)
2. Verifies ports are free
3. Starts backend and frontend
4. Monitors for startup success

### Key Principles

✅ **Idempotent**: Running multiple times = 1 backend + 1 frontend  
✅ **Deterministic**: Same behavior every time  
✅ **Developer-proof**: Cannot accidentally create duplicates  
✅ **Fail-fast**: Stops if any step fails  
✅ **Visible**: All logs in single window

---

## Scripts Overview

### 1. `restart-all.bat` (Master Script)

**Purpose**: Authoritative restart mechanism

**Usage**:
```batch
restart-all.bat
```

**Or via npm**:
```bash
npm run restart
```

**What it does**:
1. Runs `stop-services.bat`
2. Verifies ports 3001 and 5173 are free
3. Starts backend (port 3001) and frontend (port 5173) using concurrently
4. Waits up to 30 seconds for both services to start
5. Reports success/failure

**Exit codes**:
- `0` = Success (both services started)
- `1` = Failure (stop failed or startup failed)

---

### 2. `stop-services.bat` (Enhanced Cleanup)

**Purpose**: Aggressively stop all WMS services

**Usage**:
```batch
stop-services.bat
```

**Or via npm**:
```bash
npm run stop
```

**What it does**:
1. Kills processes on port 3001 (backend)
2. Kills processes on port 5173 (frontend)
3. Waits up to 10 seconds for graceful shutdown
4. Force-kills any remaining processes
5. Verifies ports are free
6. Returns exit code 0 if all stopped, 1 if issues remain

**Features**:
- Multiple retry attempts
- Detailed logging of each PID killed
- Clear success/warning messages
- Fallback to force-kill if needed

---

### 3. `verify-services.bat` (Diagnostic Helper)

**Purpose**: Check for orphaned processes and port conflicts

**Usage**:
```batch
verify-services.bat
```

**Or via npm**:
```bash
npm run verify
```

**What it checks**:
- Port 3001 status (free/in use)
- Port 5173 status (free/in use)
- Running Node.js processes (list all)
- Running cmd.exe processes (possible orphaned terminals)

**Exit codes**:
- `0` = All clear (no issues)
- `1+` = Number of issues found

**When to use**:
- Before starting development day
- After unexpected crashes
- When experiencing weird behavior
- Before running restart-all.bat

---

## NPM Scripts Reference

### Available Commands

```json
{
  "restart": "stop-services.bat && npm run restart:all",
  "stop": "stop-services.bat",
  "verify": "verify-services.bat",
  "restart:all": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
  "dev:backend": "cd backend && npm run dev",
  "dev:frontend": "npm run dev"
}
```

### Usage Examples

**Quick restart (recommended)**:
```bash
npm run restart
```

**Stop only**:
```bash
npm run stop
```

**Check for issues**:
```bash
npm run verify
```

**Start without stopping (use with caution)**:
```bash
npm run dev:all
```

---

## Workflow for Cline

### After Meaningful Changes

After any task that affects state or structure:

1. **Schema changes** (Prisma migrations, new tables)
2. **API logic changes** (new routes, controller changes)
3. **State management changes** (new contexts, state reducers)
4. **Configuration changes** (environment variables, CORS settings)
5. **Database seeding** (seed.js changes)

### Cline Should Execute

```bash
cd Warehouse-WMS-main && npm run restart
```

### Verification Steps

After restart completes successfully:

1. **Check backend health**:
   ```bash
   curl http://localhost:3001/health
   ```
   Expected: `{"status":"ok",...}`

2. **Check frontend**:
   - Open http://localhost:5173/ in browser
   - Should load without errors

3. **Verify no duplicates**:
   ```bash
   npm run verify
   ```
   Expected: "VERIFICATION PASSED"

---

## Developer Workflow

### Starting Fresh Development Session

```bash
# 1. Check for existing issues
npm run verify

# 2. If issues found, clean up
npm run stop

# 3. Start with clean state
npm run restart
```

### During Development

**Hot Reload is OK for**:
- CSS changes
- Component UI changes
- Minor JS logic
- Non-state-affecting refactors

**Full Restart Required for**:
- Schema changes
- New API routes
- Database migrations
- State management changes
- Environment variable changes

### Troubleshooting

**Port still in use**:
```bash
npm run stop
# If still issues:
taskkill /F /IM node.exe
npm run restart
```

**Backend not starting**:
```bash
# Check logs in terminal
# Verify .env exists
# Check node_modules are installed
npm run verify
```

**Frontend not starting**:
```bash
# Check logs in terminal
# Verify Vite configuration
# Clear cache if needed:
rm -rf node_modules/.vite
```

**Orphaned terminals**:
```bash
# Check for orphaned cmd processes
tasklist | findstr cmd
# Kill if necessary
taskkill /F /IM cmd.exe
```

---

## Success Criteria

A successful restart should result in:

✅ **Exactly 1 backend server** on port 3001  
✅ **Exactly 1 frontend server** on port 5173  
✅ **No orphaned processes**  
✅ **No port conflicts**  
✅ **Both services responsive**  
✅ **Clean state** (no cached old data)  

### Verification Checklist

- [ ] `npm run verify` returns exit code 0
- [ ] `http://localhost:3001/health` returns 200 OK
- [ ] `http://localhost:5173/` loads in browser
- [ ] Browser console has no errors
- [ ] Backend shows "OpsUI Backend Server Running"
- [ ] Frontend shows Vite dev server
- [ ] No duplicate terminals open
- [ ] No "port already in use" errors

---

## Disabled Scripts

The following old scripts have been disabled to prevent accidental misuse:

- `start-all.bat` → `start-all.bat.disabled`
  - Created detached cmd windows
  - No cleanup before start
  - Leading to duplicate processes

**Why disabled**: These scripts caused the original problem. Use `restart-all.bat` instead.

---

## Best Practices

### DO ✅

- Always use `npm run restart` after meaningful changes
- Run `npm run verify` before starting development
- Check logs if services fail to start
- Clean up orphaned processes immediately
- Use the restart script for clean state

### DON'T ❌

- Run `start-all.bat.disabled` (it's disabled for a reason)
- Rely on hot reload for schema/API changes
- Leave orphaned processes running
- Start services manually without cleanup
- Assume "it should work" without verification

---

## Technical Details

### Ports Used

- **Backend**: 3001 (Express.js API)
- **Frontend**: 5173 (Vite dev server)

### Process Management

- Uses `concurrently` npm package
- Both services run in single terminal
- Ctrl+C stops both services cleanly
- Output labeled with BACKEND/FRONTEND prefixes

### Cleanup Strategy

1. Kill by PID on specific ports (targeted)
2. Wait up to 10 seconds for graceful shutdown
3. Force-kill remaining processes by PID
4. Verify ports are actually free
5. Report success/failure with exit code

### Why This Works

- **Targeted**: Kills only WMS processes, not all Node
- **Patient**: Gives time for graceful shutdown
- **Aggressive**: Force-kills if needed
- **Verified**: Confirms ports are free
- **Idempotent**: Safe to run multiple times

---

## FAQ

**Q: Why can't I just rely on hot reload?**  
A: Hot reload works for frontend code but not for backend state, database schemas, or server configuration. These require full restart.

**Q: What if restart-all.bat fails?**  
A: Check the error message. Usually it's a port conflict. Run `npm run stop` then `taskkill /F /IM node.exe` to force cleanup, then try again.

**Q: Can I start services without stopping first?**  
A: Yes with `npm run dev:all`, but this risks duplicate processes. Use only for development, never for deployment or after meaningful changes.

**Q: How do I know if there are orphaned processes?**  
A: Run `npm run verify`. It will show any processes on ports 3001/5173 and list all Node.js processes.

**Q: Why disable start-all.bat?**  
A: It created detached cmd windows that persisted and led to duplicate processes. The new restart-all.bat manages processes cleanly.

---

## Version History

- **v1.0** (Current): Enhanced restart workflow with aggressive cleanup and verification
- **v0.1** (Previous): Basic start-all.bat with no cleanup (problematic)

---

## Support

For issues or questions:

1. Check this guide first
2. Run `npm run verify` to diagnose
3. Check terminal logs for error messages
4. Review `stop-services.bat` output
5. Contact development team if issues persist