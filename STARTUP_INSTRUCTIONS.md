# Warehouse WMS - Startup Instructions

## Quick Start

### 1. Start Backend Server

Open a terminal and run:
```bash
cd Warehouse-WMS-main/backend
node server.js
```

The backend API will be available at: `http://localhost:3001`

### 2. Seed Database (First Time Only)

If the database is empty or you need fresh test data:
```bash
cd Warehouse-WMS-main/backend
node seed-db.cjs
```

This will create:
- 3 test users with hashed passwords
- 5 products
- 5 orders with items

### 3. Start Frontend Dev Server

Open a new terminal and run:
```bash
cd Warehouse-WMS-main
npx vite
```

Or use the package.json script:
```bash
cd Warehouse-WMS-main
npm run dev
```

The frontend will be available at: `http://localhost:5173`

## Test Credentials

After seeding the database, you can login with:

### Admin User
- Email: `admin@example.com`
- Password: `password123`
- Role: ADMIN
- Avatar: 👨‍💼

### Picker User
- Email: `picker@example.com`
- Password: `password123`
- Role: PICKER
- Avatar: 👷

### Packer User
- Email: `packer@example.com`
- Password: `password123`
- Role: PACKER
- Avatar: 👩‍🔧

## Architecture

### Frontend (Vite + React)
- **Port**: 5173
- **Tech Stack**: React, Vite, Tailwind CSS, React Router
- **Location**: `Warehouse-WMS-main/`
- **API Client**: `src/services/api.js` (connects to backend at localhost:3001)

### Backend (Node.js + Express + Prisma)
- **Port**: 3001
- **Tech Stack**: Node.js, Express, Prisma ORM, JWT Auth
- **Location**: `Warehouse-WMS-main/backend/`
- **Database**: SQLite (prisma/dev.db)

## Key API Endpoints

### Authentication
- `POST /api/auth/login` - Login with email/password
- `GET /api/auth/me` - Get current user info

### Orders
- `GET /api/orders` - Get all orders (requires auth)
- `GET /api/orders/:id` - Get order by ID
- `POST /api/orders` - Create new order (admin only)
- `PUT /api/orders/:id` - Update order
- `DELETE /api/orders/:id` - Delete order (admin only)

### Products
- `GET /api/products` - Get all products (requires auth)
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create new product (admin only)

### Users
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user (admin or self)

## Troubleshooting

### Backend won't start
- Check if port 3001 is already in use
- Ensure `.env` file exists in `Warehouse-WMS-main/backend/`
- Verify Prisma client is generated: `cd Warehouse-WMS-main/backend && npx prisma generate`

### Frontend won't start
- Check if port 5173 is already in use
- Ensure dependencies are installed: `cd Warehouse-WMS-main && npm install`
- Try running with explicit command: `npx vite`

### Login not working
- Ensure database is seeded: run `node seed-db.cjs`
- Verify password is exactly `password123`
- Check browser console for errors
- Verify backend is running on port 3001

### No data showing on frontend
- Confirm backend is running: `curl http://localhost:3001/api/health`
- Confirm frontend is running: Open `http://localhost:5173` in browser
- Check browser console for API errors (F12)
- Verify token is being stored in localStorage

## Development Workflow

1. **Start backend**: Open terminal 1 → `cd Warehouse-WMS-main/backend && node server.js`
2. **Start frontend**: Open terminal 2 → `cd Warehouse-WMS-main && npm run dev`
3. **Open browser**: Navigate to `http://localhost:5173`
4. **Login**: Use admin@example.com / password123
5. **Develop**: Make changes to frontend code (hot reloads automatically)
6. **Backend changes**: Restart backend server after changes

## Database Reset

To completely reset the database:

```bash
cd Warehouse-WMS-main/backend
rm prisma/dev.db
npx prisma migrate reset --force
node seed-db.cjs
```

## Environment Variables

Backend `.env` file should contain:
```
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-key-here"
PORT=3001
NODE_ENV="development"
```

## Building for Production

```bash
# Build frontend
cd Warehouse-WMS-main
npm run build

# Preview production build
npm run preview
```

## Support

For issues or questions:
1. Check browser console (F12) for JavaScript errors
2. Check backend terminal for server errors
3. Verify both servers are running
4. Check API connectivity: `curl http://localhost:3001/api/health`