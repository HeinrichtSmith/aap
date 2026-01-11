# OpsUI Backend Contract

**AUTHORITATIVE SOURCE** - All backend work must adhere to this contract.

---

## API Architecture

### Base Configuration
- **Base URL**: `http://localhost:3001/api` (development)
- **Protocol**: HTTP/1.1 (upgrade to HTTPS in production)
- **Versioning**: No version prefix (e.g., `/api/auth`, NOT `/api/v1/auth`)
- **Format**: JSON for both requests and responses

### Resource Paths
- Authentication: `/api/auth`
- Orders: `/api/orders`
- Products: `/api/products`
- Bins: `/api/bins` (future)
- Inventory: `/api/inventory` (future)
- Purchase Orders: `/api/purchase-orders` (future)
- Reports: `/api/reports` (future)

### HTTP Methods
- `GET` - Retrieve resources (read-only, idempotent)
- `POST` - Create new resources (non-idempotent)
- `PUT` - Update entire resources (idempotent)
- `PATCH` - Partial updates (use sparingly, prefer PUT)
- `DELETE` - Remove resources (idempotent, use soft deletes where applicable)

---

## Authentication Model

### Token-Based Authentication
- **Mechanism**: JWT (JSON Web Tokens)
- **Header Format**: `Authorization: Bearer <token>`
- **Algorithm**: HS256 (HMAC SHA-256)
- **Expiration**: 7 days (configurable via `JWT_EXPIRES_IN`)

### User Roles
```
ADMIN      - Full system access, user management
MANAGER    - Order management, reporting, limited user management
PICKER     - Order picking, inventory updates
PACKER     - Order packing, shipping preparation
RECEIVER   - Purchase order receiving, inventory intake
STAFF      - Read-only access + assigned operations
```

### Permission Matrix

| Resource          | ADMIN | MANAGER | PICKER | PACKER | RECEIVER | STAFF |
|-------------------|-------|---------|--------|--------|----------|-------|
| /api/auth/*       | Full  | Full    | Self   | Self   | Self     | Self  |
| /api/orders/*     | Full  | Full    | Read+Update | Read+Update | Read | Read  |
| /api/products/*   | Full  | Full    | Read   | Read   | Read     | Read  |
| /api/bins/*       | Full  | Full    | Read   | Read   | Read     | Read  |
| /api/users/*      | Full  | Limited | Self   | Self   | Self     | Self  |
| /api/reports/*    | Full  | Full    | None   | None   | None     | None  |

### Protected Routes
- All routes except `/api/auth/register` and `/api/auth/login` require authentication
- Use `authenticate` middleware for protected routes
- Use `authorize(...roles)` middleware for role-based access

---

## Error Response Shape

### Standard Format
```json
{
  "error": "ErrorType",
  "message": "Human-readable error message",
  "details": {}
}
```

### Error Types
- `ValidationError` - Input validation failed (400)
- `UnauthorizedError` - Missing or invalid token (401)
- `ForbiddenError` - Insufficient permissions (403)
- `NotFoundError` - Resource not found (404)
- `ConflictError` - Duplicate or conflicting data (409)
- `InternalServerError` - Server error (500)

### HTTP Status Codes
- `200 OK` - Successful GET, PUT, DELETE
- `201 Created` - Successful POST
- `400 Bad Request` - Validation error, malformed input
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Valid token, insufficient permissions
- `404 Not Found` - Resource does not exist
- `409 Conflict` - Duplicate record, constraint violation
- `500 Internal Server Error` - Unexpected server error

---

## Pagination Format

### Query Parameters
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50, max: 100)
- `sort` - Sort field (e.g., `createdAt`, `name`)
- `order` - Sort direction: `asc` or `desc` (default: `desc`)

### Response Shape
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1250,
    "totalPages": 25,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

## Naming Conventions

### Database Models (Prisma)
- Singular form: `User`, `Product`, `Order` (NOT `Users`, `Products`)
- PascalCase: `OrderStatus`, `UserRole`
- Foreign keys: `userId`, `productId` (camelCase, singular)
- Indexes: Use meaningful names like `user_email_unique`

### API Endpoints
- Plural nouns: `/api/orders`, `/api/products`
- Kebab-case for action endpoints: `/api/orders/:id/assign-picker`
- Lowercase only: `/api/auth/me`

### JavaScript/TypeScript
- Files: kebab-case: `authController.js`, `ordersRoutes.js`
- Functions: camelCase: `getOrders`, `updateOrderStatus`
- Constants: UPPER_SNAKE_CASE: `JWT_SECRET`, `RATE_LIMIT_MAX_REQUESTS`
- Classes: PascalCase: `OrderService`, `InventoryManager`

### Environment Variables
- UPPER_SNAKE_CASE: `DATABASE_URL`, `JWT_SECRET`, `PORT`
- Group by prefix: `DB_`, `JWT_`, `RATE_LIMIT_`, `LOG_`

---

## Date/Time Standards

### Database Storage
- **Type**: `DateTime` (Prisma type: `DateTime`)
- **Timezone**: UTC (store all times in UTC)
- **Format**: ISO 8601: `2026-01-05T05:00:00.000Z`

### API Responses
- Always return ISO 8601 format
- Include timezone offset if not UTC: `2026-01-05T18:00:00+13:00`
- Frontend handles display timezone conversion (NZT)

### Date Ranges
- Query parameters: `startDate`, `endDate`
- Inclusive of start, exclusive of end: `[startDate, endDate)`
- Format: ISO 8601 strings

---

## ID Strategy

### Primary Keys
- **Type**: UUID v4 (string)
- **Format**: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
- **Generated**: `@default(uuid())` in Prisma schema
- **Length**: 36 characters

### Natural Keys
- User: Email (unique)
- Product: SKU (unique), Barcode (unique)
- Bin: Code (unique)
- Order: Custom ID string (e.g., `ORD-2026-00123`)

### Example IDs
```javascript
User:      "usr_123e4567-e89b-12d3-a456-426614174000"
Product:   "prd_987f6543-e21b-45d6-a789-123456789abc"
Order:     "ord_20260105_00123"
```

---

## Integration Adapter Pattern

### External Integrations
- NetSuite ERP
- Courier APIs (NZ Couriers, NZ Post, Mainfreight, Post Haste)
- Payment gateways (future)

### Adapter Interface
```javascript
// Base adapter structure
class IntegrationAdapter {
  constructor(credentials) { /* ... */ }
  async testConnection() { /* ... */ }
  async fetchSalesOrders() { /* ... */ }
  async updateOrderStatus(orderId, status) { /* ... */ }
  async createShipment(orderId, carrier, trackingNumber) { /* ... */ }
  mapToInternalFormat(externalData) { /* ... */ }
}
```

### Implementation Rules
- Each integration in its own adapter file: `src/integrations/netsuiteAdapter.js`
- Adapters only: NO direct third-party API calls in controllers
- Error handling: Catch integration errors, return standardized responses
- Credentials: Stored in environment variables, never in code
- Retry logic: Implemented in adapter, not controller
- Rate limiting: Respect external API limits, add delays between calls

### Adapter Configuration
```javascript
// src/config/integrations.js
export const INTEGRATIONS = {
  netsuite: {
    enabled: process.env.NETSUITE_ENABLED === 'true',
    baseUrl: process.env.NETSUITE_BASE_URL,
    adapterClass: 'NetSuiteAdapter'
  },
  nzCouriers: {
    enabled: process.env.NZ_COURIERS_ENABLED === 'true',
    adapterClass: 'NZCouriersAdapter'
  }
};
```

---

## Background Job Conventions

### Job Queue System
- **Library**: Bull (Redis-based)
- **Queue Name**: Pattern: `<entity>:<action>` (e.g., `orders:sync`, `inventory:recount`)
- **Job Data**: JSON object with required fields

### Job Structure
```javascript
{
  "id": "job_123",
  "type": "order_sync",
  "data": {
    "orderId": "ord_20260105_00123",
    "externalSystem": "netsuite"
  },
  "priority": 1, // 0-10, higher = more urgent
  "attempts": 0,
  "maxRetries": 3,
  "delay": 0,
  "timeout": 30000 // 30 seconds
}
```

### Job Types
- **Sync Jobs**: External system sync (NetSuite, couriers)
- **Notification Jobs**: Email/SMS alerts
- **Report Jobs**: Generate reports asynchronously
- **Maintenance Jobs**: Database cleanup, archive old data

### Error Handling
- Log all job failures with full context
- Implement exponential backoff for retries
- Notify admin after max retries exceeded
- Dead letter queue for permanently failed jobs

### Cron Schedules
- Order sync: Every 5 minutes (`*/5 * * * *`)
- Inventory recount: Daily at 2 AM NZT (`0 15 * * *` UTC)
- Report generation: Daily at 6 AM NZT (`0 17 * * *` UTC)

---

## Logging Standards

### Log Levels
- `error` - Critical errors requiring immediate attention
- `warn` - Warning conditions, potential issues
- `info` - General informational messages (normal operations)
- `debug` - Detailed debugging information (development only)

### Log Format
```json
{
  "timestamp": "2026-01-05T05:00:00.000Z",
  "level": "info",
  "message": "Order created",
  "userId": "usr_123",
  "orderId": "ord_20260105_00123",
  "ip": "127.0.0.1",
  "method": "POST",
  "path": "/api/orders",
  "duration": 245
}
```

### What to Log
- All API requests (with duration)
- All errors (with stack trace)
- Authentication/authorization failures
- External API calls (request/response)
- Job queue operations
- Database queries (slow queries only, > 100ms)

### Sensitive Data
- NEVER log passwords, API keys, tokens
- Mask email addresses: `u***@example.com`
- Mask credit card numbers: `****-****-****-1234`
- Mask personal identifiers in production logs

---

## Rate Limiting

### Default Configuration
- **Window**: 15 minutes
- **Max Requests**: 100 per IP
- **Endpoints**: All `/api/*` routes

### Response
```json
{
  "error": "Too Many Requests",
  "message": "Too many requests from this IP, please try again later."
}
```

### Headers
- `X-RateLimit-Limit`: 100
- `X-RateLimit-Remaining`: 95
- `X-RateLimit-Reset`: Unix timestamp

---

## Validation Rules

### Input Validation
- Use `express-validator` middleware
- Validate all public endpoints
- Reject invalid requests with 400 status
- Return specific validation error messages

### Common Validations
- Email: Valid email format, max 255 chars
- Password: Min 6 characters, require strong password in production
- UUID: Valid UUID v4 format
- Numbers: Numeric type, positive where applicable
- Strings: Trim whitespace, max length constraints
- Dates: Valid ISO 8601 format

### Example
```javascript
[
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('name').notEmpty().trim().isLength({ max: 100 })
]
```

---

## Security Baselines

### Required Middleware Stack
1. Helmet (security headers)
2. CORS (origin validation)
3. Rate limiting (DDoS protection)
4. Input validation (sanitization)
5. Authentication (JWT verification)
6. Authorization (role-based access)

### Data Protection
- Passwords: Hash with bcrypt (salt rounds: 10)
- JWT: Sign with HS256, strong secret (32+ chars)
- Database: Connection via SSL in production
- Environment: Never commit `.env` file

### CORS Configuration
- Development: Allow specific origin
- Production: Whitelist frontend domains
- Credentials: Enabled for auth flows
- Methods: GET, POST, PUT, PATCH, DELETE
- Headers: Authorization, Content-Type

---

## Testing Requirements

### Unit Tests
- Test all controller functions
- Test all service functions
- Test all utility functions
- Mock external dependencies

### Integration Tests
- Test API endpoints with database
- Test authentication flows
- Test error scenarios

### Test Structure
```
tests/
├── unit/
│   ├── controllers/
│   ├── services/
│   └── utils/
└── integration/
    ├── auth.test.js
    ├── orders.test.js
    └── products.test.js
```

---

## Documentation Requirements

### API Documentation
- Use OpenAPI 3.0 (Swagger) format
- Document all endpoints
- Include request/response examples
- Document authentication requirements

### Code Comments
- Comment complex business logic
- Document non-obvious algorithms
- Explain external API integrations
- Include TODO comments for future work

---

## Performance Targets

### Response Times
- API endpoint: < 200ms (p95)
- Database query: < 50ms (p95)
- Authentication: < 100ms (p95)
- Simple CRUD: < 100ms (p95)

### Database
- Use indexes for frequently queried fields
- Optimize N+1 queries with `include` or `select`
- Use pagination for large result sets
- Cache frequently accessed data (Redis)

---

## Deployment Standards

### Environment Variables
- Required in all environments: `DATABASE_URL`, `JWT_SECRET`, `PORT`
- Production only: `NODE_ENV=production`, strong secrets
- Development only: Debug logging, hot reload

### Process Management
- Use PM2 for production
- Enable cluster mode (multiple workers)
- Graceful shutdown handling
- Automatic restart on crash

### Database Migrations
- Use Prisma migrations in production
- Never use `db push` in production
- Review migrations before applying
- Backup database before major migrations

---

## Version Control

### Git Workflow
- Main branch: Production-ready code
- Feature branches: `feature/ticket-description`
- Pull requests required for all changes
- Code review mandatory
- Tests must pass before merge

### Commit Messages
- Format: `type(scope): description`
- Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`
- Examples:
  - `feat(auth): add role-based access control`
  - `fix(orders): prevent duplicate status updates`
  - `docs(readme): update installation instructions`

---

**This contract is binding. Violations require explicit approval from lead architect.**
