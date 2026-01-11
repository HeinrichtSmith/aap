# OpsUI Backend API

Production-ready warehouse and inventory management system backend for OpsUI.

## Features

- **Authentication & Authorization**: JWT-based auth with role-based access control (RBAC)
- **Database**: PostgreSQL with Prisma ORM
- **API**: RESTful API with Express.js
- **Security**: Helmet, CORS, rate limiting, input validation
- **Logging**: Winston with structured logging
- **Warehouse Operations**: Order management, picking, packing, inventory tracking
- **User Management**: XP system, achievements, stats tracking

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Auth**: JWT (jsonwebtoken)
- **Validation**: express-validator
- **Security**: helmet, express-rate-limit
- **Logging**: winston
- **Hashing**: bcrypt

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

## Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Configuration

Copy `.env.example` to `.env` and update values:

```bash
cp .env.example .env
```

Update `.env` with your configuration:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/opsui?schema=public"

# Server
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
```

### 3. Database Setup

```bash
# Generate Prisma Client
npm run prisma:generate

# Push schema to database
npm run prisma:push

# Or use migrations (recommended for production)
npm run prisma:migrate

# Seed database with initial data
npm run prisma:seed

# Or do all at once
npm run db:setup
```

### 4. Start Server

Development (with hot reload):
```bash
npm run dev
```

Production:
```bash
npm start
```

The API will be available at `http://localhost:3001`

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|---------|-----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/logout` | Logout user |

### Orders

| Method | Endpoint | Description |
|---------|-----------|-------------|
| GET | `/api/orders` | Get all orders |
| GET | `/api/orders/stats` | Get order statistics |
| GET | `/api/orders/:id` | Get single order |
| POST | `/api/orders` | Create order |
| PUT | `/api/orders/:id/status` | Update order status |
| PUT | `/api/orders/:id/assign-picker` | Assign picker |
| PUT | `/api/orders/:id/pick` | Pick item |
| PUT | `/api/orders/:id/assign-packer` | Assign packer |
| PUT | `/api/orders/:id/pack` | Pack order |
| PUT | `/api/orders/:id/ship` | Ship order |

### Products

| Method | Endpoint | Description |
|---------|-----------|-------------|
| GET | `/api/products` | Get all products |
| GET | `/api/products/low-stock` | Get low stock products |
| GET | `/api/products/:id` | Get product by ID |
| GET | `/api/products/sku/:sku` | Get product by SKU |
| GET | `/api/products/barcode/:barcode` | Get product by barcode |
| POST | `/api/products` | Create product |
| PUT | `/api/products/:id` | Update product |
| DELETE | `/api/products/:id` | Delete product |
| PUT | `/api/products/:id/inventory` | Update inventory |

## User Roles

- **ADMIN**: Full access to all resources
- **MANAGER**: Manage orders, products, users
- **PICKER**: Pick orders, update inventory
- **PACKER**: Pack orders
- **RECEIVER**: Receive purchase orders
- **STAFF**: Read-only access + assigned operations

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

## Example Requests

### Login

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@arrowhead.co.nz",
    "password": "admin123"
  }'
```

### Create Order

```bash
curl -X POST http://localhost:3001/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "customerName": "John Doe",
    "customerEmail": "john@example.com",
    "customerPhone": "+64 21 123 4567",
    "items": [
      {
        "sku": "ARM-SENS-001",
        "quantity": 2,
        "location": "A-01-02"
      }
    ],
    "shippingAddress": {
      "street": "123 Main St",
      "city": "Auckland",
      "zip": "1010",
      "country": "NZ"
    }
  }'
```

## Database Schema

### Core Models

- **User**: Users with roles, XP, achievements
- **Product**: Products with SKUs, barcodes, inventory
- **Bin**: Warehouse bins with locations
- **Order**: Sales orders with items and status
- **PurchaseOrder**: Incoming inventory orders
- **Activity**: Audit log of user actions
- **Achievement**: Gamification achievements
- **UserAchievement**: User achievement unlocks

## Error Handling

All errors follow a consistent format:

```json
{
  "error": "Error Type",
  "message": "Error description",
  "details": {}
}
```

Common status codes:
- `400` - Bad Request / Validation Error
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict (duplicate)
- `500` - Internal Server Error

## Default Users

After seeding, these users are available:

| Role | Email | Password |
|-------|--------|----------|
| Admin | admin@arrowhead.co.nz | admin123 |
| Picker | picker@arrowhead.co.nz | picker123 |
| Packer | packer@arrowhead.co.nz | packer123 |

## Development

### Running Tests

```bash
npm test
```

### Code Structure

```
src/
├── config/
│   └── database.js       # Prisma client setup
├── controllers/
│   ├── authController.js   # Authentication logic
│   ├── ordersController.js # Order management
│   └── productsController.js # Product management
├── middleware/
│   ├── auth.js            # JWT authentication
│   └── errorHandler.js   # Error handling
├── routes/
│   ├── authRoutes.js      # Auth endpoints
│   ├── ordersRoutes.js    # Order endpoints
│   └── productsRoutes.js  # Product endpoints
├── utils/
│   └── logger.js         # Winston logger
└── server.js            # Express app
```

## Production Deployment

1. Set `NODE_ENV=production`
2. Use a production-grade database
3. Use strong `JWT_SECRET`
4. Enable HTTPS
5. Set up proper CORS origins
6. Configure logging level
7. Use migrations, not db push
8. Set up process manager (PM2, systemd)
9. Configure health checks
10. Set up monitoring

## Security Checklist

- [ ] Change default passwords
- [ ] Use strong JWT secrets
- [ ] Enable HTTPS
- [ ] Configure CORS properly
- [ ] Set rate limits
- [ ] Enable Helmet security headers
- [ ] Input validation on all endpoints
- [ ] Role-based access control
- [ ] Audit logging
- [ ] Regular dependency updates

## License

UNLICENSED - Proprietary software for Arrowhead Polaris

## Support

For issues or questions, contact the development team.
