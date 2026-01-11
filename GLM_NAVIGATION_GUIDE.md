# GLM 4.5 Navigation Guide - WMS Project

## Quick Start Commands

### Starting the Application
```bash
# Method 1: Use the batch script (RECOMMENDED for GLM)
START_BACKEND_AND_FRONTEND.bat

# Method 2: Manual startup
cd backend
npm start
# Then in a new terminal:
npm run dev
```

### Stopping the Application
```bash
STOP_ALL_SERVERS.bat
```

---

## Project Structure

### Core Application Files
```
Warehouse-WMS-main/
├── backend/                    # Node.js/Express API Server
│   ├── src/
│   │   ├── controllers/        # API endpoint handlers
│   │   ├── routes/            # API route definitions
│   │   ├── services/          # Business logic
│   │   ├── middleware/        # Auth, validation, error handling
│   │   └── server.js          # Backend entry point
│   ├── package.json           # Backend dependencies
│   └── .env                   # Backend environment variables
│
├── src/                       # React Frontend
│   ├── components/
│   │   ├── picking/          # Order picking UI components
│   │   │   └── OptimizedPickingItem.jsx    # Main picking card
│   │   ├── packing/          # Order packing UI components
│   │   │   └── OptimizedPackingItem.jsx    # Main packing card
│   │   ├── GameIcon.jsx       # Tiered icon system
│   │   └── Layout.jsx         # Main app layout
│   ├── pages/
│   │   ├── Picking.jsx        # Picking workflow page
│   │   ├── Packing.jsx        # Packing workflow page
│   │   ├── Dashboard.jsx      # Main dashboard
│   │   └── Shipping.jsx       # Shipping workflow
│   ├── services/
│   │   └── api.js             # API client for backend
│   └── utils/
│       └── orderNormalizer.js # Order data transformation
│
├── package.json               # Frontend dependencies
├── vite.config.js             # Vite build configuration
└── index.html                 # Entry HTML file
```

---

## Key Files for Common Tasks

### Fixing UI Issues in Picking/Packing
1. **Picking Component**: `src/components/picking/OptimizedPickingItem.jsx`
2. **Packing Component**: `src/components/packing/OptimizedPackingItem.jsx`

### Fixing GameIcon Issues
- **File**: `src/components/GameIcon.jsx`
- **Constants**: `src/config/gameIconConstants.js`

### API/Data Issues
- **Frontend API Client**: `src/services/api.js`
- **Order Normalization**: `src/utils/orderNormalizer.js`
- **Backend Controllers**: `backend/src/controllers/`

### Page-Level Changes
- **Picking Page**: `src/pages/Picking.jsx`
- **Packing Page**: `src/pages/Packing.jsx`
- **Dashboard**: `src/pages/Dashboard.jsx`

---

## GLM-Specific Execution Tips

### Running Both Servers
GLM should use the batch script approach:
```batch
START_BACKEND_AND_FRONTEND.bat
```

This script:
1. Kills existing Node processes
2. Starts backend on port 3001
3. Waits 3 seconds for initialization
4. Starts frontend on port 5173
5. Opens browser automatically

### Common GLM Issues and Solutions

**Issue**: "Backend fails to start"
**Solution**: Check if port 3001 is already in use. Run `STOP_ALL_SERVERS.bat` first.

**Issue**: "Frontend shows compilation errors"
**Solution**: Check JSX structure in the component file mentioned in the error.

**Issue**: "Cannot connect to backend"
**Solution**: Ensure backend is running before starting frontend.

---

## Component Architecture

### Picking Flow
1. `OrderSelectionScreen.jsx` - Select order to pick
2. `Picking.jsx` - Main picking workflow
3. `OptimizedPickingItem.jsx` - Individual item cards
4. `PickingConfirmation.jsx` - Confirm completion

### Packing Flow
1. `Packing.jsx` - Main packing workflow
2. `OptimizedPackingItem.jsx` - Individual item cards
3. `ConfirmationScreen.jsx` - Confirm completion

---

## Data Flow

### Order Data Normalization
```javascript
// Backend provides raw data → Frontend normalizes → UI displays
backend/api/orders → orderNormalizer.js → Picking/Packing components
```

### Key Fields
- `soNumber`: Human-readable order ID (e.g., "SO-2024-001")
- `id`: Internal UUID (used for tracking, not display)
- `items`: Array of order items
- `status`: Order status (pending, picking, packed, shipped)

---

## Quick File Reference for GLM

| Task | File | Line Numbers (approx) |
|------|------|----------------------|
| Change order header display | `src/pages/Picking.jsx` | 38-42 |
| Fix item card height | `src/components/picking/OptimizedPickingItem.jsx` | 743 (min-h) |
| Fix GameIcon overlap | `src/components/GameIcon.jsx` | 58 (overflow-hidden) |
| API endpoint configuration | `src/services/api.js` | 1-20 |
| Order data mapping | `src/utils/orderNormalizer.js` | 15-30 |

---

## Testing Commands

### Backend Only
```bash
cd backend
npm start
```

### Frontend Only
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

---

## Environment Variables

### Backend (`backend/.env`)
```
PORT=3001
NODE_ENV=development
DATABASE_URL=file:./dev.db
```

### Frontend (uses Vite defaults)
- Dev Server: http://localhost:5173
- API Proxy: http://localhost:3001

---

## Troubleshooting

### "Cannot find module" Error
```bash
# Install dependencies
npm install
cd backend && npm install
```

### "Port already in use" Error
```bash
# Run the stop script
STOP_ALL_SERVERS.bat
```

### Build Failures
Check for JSX syntax errors in the component mentioned in the error.
Common issues:
- Unclosed `<div>` or `<motion.div>` tags
- Missing closing `)`
- Incorrect self-closing tags

---

## Last Updated
2025-01-12 - Added batch scripts and simplified navigation for GLM 4.5
