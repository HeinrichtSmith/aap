# QUICK TASK REFERENCE

## Start Servers (One Command)
```batch
START_BACKEND_AND_FRONTEND.bat
```
**GLM**: Execute this file to start both backend and frontend

## Stop Servers
```batch
STOP_ALL_SERVERS.bat
```

---

## Fix Common Issues

### Issue: "Order shows UUID instead of SO-Number"
**File**: `src/pages/Picking.jsx`
**Line**: 38
**Fix**: Change `orderId: selectedOrder?.id` to `orderId: selectedOrder?.soNumber`

### Issue: "GameIcon overlaps item name"
**File**: `src/components/GameIcon.jsx`
**Line**: 58
**Fix**: Add `overflow-hidden` to className

### Issue: "Item cards too squished"
**File**: `src/components/picking/OptimizedPickingItem.jsx`
**Line**: 743 (full-size card)
**Fix**: Change `min-h-[240px]` to `min-h-[400px]`

### Issue: "Status text overlap"
**File**: `src/components/picking/OptimizedPickingItem.jsx`
**Lines**: 1022, 1029, 1036 (status containers)
**Fix**: Add `h-16` to reserve space

---

## JSX Structure Errors

### Error: "Unexpected closing div tag"
**Most likely cause**: Mismatched `</div>` and `</motion.div>` tags

**Files to check**:
- `src/components/picking/OptimizedPickingItem.jsx`
- `src/components/packing/OptimizedPackingItem.jsx`

**How to fix**:
1. Count opening `<div>` tags
2. Count closing `</div>` tags
3. Ensure they match
4. Check that `</motion.div>` closes `<motion.div>`, not `</div>`

---

## File Locations (Most Common)

| What You Need | File |
|--------------|------|
| Picking item cards | `src/components/picking/OptimizedPickingItem.jsx` |
| Packing item cards | `src/components/packing/OptimizedPackingItem.jsx` |
| Game icons | `src/components/GameIcon.jsx` |
| API calls | `src/services/api.js` |
| Order data | `src/utils/orderNormalizer.js` |
| Backend API | `backend/src/` |
| Environment config | `backend/.env` |

---

## Build Commands

```bash
# Development
npm run dev

# Production build
npm run build

# Backend only
cd backend
npm start

# Install dependencies
npm install
cd backend && npm install
```

---

## Port Configuration

- Frontend: `5173` (Vite default)
- Backend: `3001` (set in `backend/.env`)
- Database: `file:./dev.db` (SQLite)

---

## Test the Application

1. Open: http://localhost:5173/
2. Navigate to "Picking" or "Packing"
3. Verify:
   - Order headers show SO numbers (not UUIDs)
   - GameIcons don't overlap text
   - Cards have proper height
   - No console errors

---

## Commit to GitHub

```bash
git add -A
git commit -m "Description of changes"
git push origin main
```
