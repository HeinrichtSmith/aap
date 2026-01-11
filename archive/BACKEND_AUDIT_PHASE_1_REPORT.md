# Phase 1: Full Backend Audit Report
**Generated:** 2026-01-05  
**Auditor:** Senior Backend Engineer  
**Project:** OpsUI Warehouse Management System

---

## Executive Summary

The backend has a solid foundation with authentication, orders, and products modules. However, **critical gaps exist** that prevent production readiness. Major issues include: no organization/site management, no plan enforcement, missing API endpoints, and broken frontend-backend data contracts.

**Overall Status:** ⚠️ PARTIAL - Requires significant development before production

---

## 1. EXISTING BACKEND INFRASTRUCTURE ✅

### 1.1 Database Schema (Prisma)
**Status:** ✅ COMPREHENSIVE
- User, UserStats, Achievement, UserAchievement models
- Product, Bin, InventoryItem, BinProduct models
- Order, OrderItem models
- PurchaseOrder, PurchaseOrderItem models
- Return, StockTake, StockTakeItem models
- Activity logging model
- Batch, BatchOrder, Wave models
- Proper indexes and relations

### 1.2 Authentication Module
**Status:** ✅ IMPLEMENTED
- JWT-based authentication
- Role-based access control (ADMIN, MANAGER, PICKER, PACKER, RECEIVER, STAFF)
- Password hashing with bcrypt
- Register, login, logout, get current user endpoints

### 1.3 Orders Module
**Status:** ✅ IMPLEMENTED
- CRUD operations for orders
- Order status management (PENDING, PICKING, READY_TO_PACK, PACKED, SHIPPED, CANCELLED)
- Picker/Packer assignment
- Item picking and packing workflows
- Order statistics

### 1.4 Products Module
**Status:** ✅ IMPLEMENTED
- CRUD operations for products
- Inventory management
- Low stock alerts
- Barcode and SKU lookup

### 1.5 Server & Middleware
**Status:** ✅ IMPLEMENTED
- Express.js server
- Helmet security headers
- CORS configuration
- Rate limiting
- Request logging with Morgan
- Error handling middleware
- Not found handler

### 1.6 Logging
**Status:** ✅ IMPLEMENTED
- Winston logger
- Structured logging
- Error logging with context

---

## 2. CRITICAL GAPS ❌

### 2.1 Organization/Site Management ❌ CRITICAL
**Impact:** BLOCKING - Cannot support multi-site, multi-tenant operations

**Missing:**
- ❌ No Company/Organization model in schema
- ❌ No Site/Warehouse model
- ❌ No user ↔ site assignment mapping
- ❌ No multi-tenancy isolation logic
- ❌ No cross-site data access controls

**Required:**
```prisma
model Company {
  id          String   @id @default(uuid())
  name        String   @unique
  plan        PlanType @default(STARTER)
  status      CompanyStatus @default(ACTIVE)
  users       User[]
  sites       Site[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Site {
  id          String   @id @default(uuid())
  companyId   String
  company     Company   @relation(fields: [companyId], references: [id])
  code        String   @unique
  name        String
  address     Json?
  isActive    Boolean  @default(true)
  users       User[]
  inventory   InventoryItem[]
  orders      Order[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

**Required API Endpoints:**
- `POST /api/companies` - Create company
- `GET /api/companies/:id` - Get company
- `PUT /api/companies/:id` - Update company
- `POST /api/sites` - Create site
- `GET /api/sites` - List sites
- `GET /api/sites/:id` - Get site
- `PUT /api/sites/:id` - Update site
- `POST /api/users/:userId/assign-site` - Assign user to site

---

### 2.2 Plan/Billing Enforcement ❌ CRITICAL
**Impact:** BLOCKING - Cannot enforce Starter/Pro/Elite limits server-side

**Missing:**
- ❌ No Plan model in schema
- ❌ No subscription tracking
- ❌ No user count enforcement per plan
- ❌ No site count enforcement per plan
- ❌ No plan upgrade/downgrade logic
- ❌ No billing integration hooks

**Plan Limits (from requirements):**
- **Starter:** Max 15 users, 1-2 sites
- **Pro:** Max 30 users, 2-4 sites
- **Elite:** Max 50 users, multi-site

**Required Schema:**
```prisma
model Subscription {
  id          String   @id @default(uuid())
  companyId   String
  company     Company   @relation(fields: [companyId], references: [id])
  plan        PlanType
  status      SubscriptionStatus
  startDate   DateTime
  endDate     DateTime?
  usersLimit  Int
  sitesLimit  Int
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

enum PlanType {
  STARTER
  PRO
  ELITE
}
```

**Required Middleware:**
```javascript
export const enforcePlanLimits = async (req, res, next) => {
  const company = await prisma.company.findUnique({
    where: { id: req.user.companyId },
    include: { users: true, sites: true }
  });

  if (company.users.length >= company.subscription.usersLimit) {
    return res.status(403).json({
      error: 'PlanLimitReached',
      message: `Your ${company.subscription.plan} plan has reached the user limit of ${company.subscription.usersLimit}`
    });
  }
  // Similar logic for sites
  next();
};
```

**Required API Endpoints:**
- `GET /api/companies/:id/subscription` - Get subscription status
- `PUT /api/companies/:id/plan` - Upgrade/downgrade plan
- `GET /api/companies/:id/usage` - Get current usage stats

---

### 2.3 Bins Management ❌ CRITICAL
**Impact:** BLOCKING - Frontend has bins data but no backend API

**Missing:**
- ❌ No bin routes in backend
- ❌ No bin controller
- ❌ Frontend `src/data/bins.json` has no corresponding API
- ❌ Bin schema exists but unused

**Required API Endpoints:**
- `GET /api/bins` - List all bins
- `GET /api/bins/:id` - Get single bin
- `GET /api/bins/:code` - Get bin by code
- `POST /api/bins` - Create bin
- `PUT /api/bins/:id` - Update bin
- `DELETE /api/bins/:id` - Delete bin
- `GET /api/bins/:id/inventory` - Get bin inventory

---

### 2.4 Purchase Orders (Inwards) ❌ HIGH
**Impact:** HIGH - Cannot receive inventory from suppliers

**Missing:**
- ❌ No purchase order routes
- ❌ No purchase order controller
- ❌ No receiving workflow
- ❌ Frontend `src/data/purchaseOrders.json` has no API

**Required API Endpoints:**
- `GET /api/purchase-orders` - List POs
- `GET /api/purchase-orders/:id` - Get PO
- `POST /api/purchase-orders` - Create PO
- `PUT /api/purchase-orders/:id/receive` - Receive items
- `PUT /api/purchase-orders/:id/status` - Update status

---

### 2.5 Returns Management ❌ HIGH
**Impact:** HIGH - Cannot handle customer returns

**Missing:**
- ❌ No returns routes
- ❌ No returns controller
- ❌ Frontend `src/data/returns.json` has no API

**Required API Endpoints:**
- `GET /api/returns` - List returns
- `GET /api/returns/:id` - Get return
- `POST /api/returns` - Create return
- `PUT /api/returns/:id/approve` - Approve return
- `PUT /api/returns/:id/reject` - Reject return
- `PUT /api/returns/:id/process` - Process return

---

### 2.6 Stock Takes ❌ HIGH
**Impact:** HIGH - Cannot perform inventory audits

**Missing:**
- ❌ No stock take routes
- ❌ No stock take controller
- ❌ Frontend `src/data/stockTakes.json` has no API

**Required API Endpoints:**
- `GET /api/stock-takes` - List stock takes
- `GET /api/stock-takes/:id` - Get stock take
- `POST /api/stock-takes` - Create stock take
- `PUT /api/stock-takes/:id/start` - Start stock take
- `PUT /api/stock-takes/:id/complete` - Complete stock take
- `PUT /api/stock-takes/:id/items/:itemId` - Update item count

---

### 2.7 User Management ❌ MEDIUM
**Impact:** MEDIUM - Cannot manage users beyond registration

**Missing:**
- ❌ No user management routes
- ❌ No user list endpoint
- ❌ No user update endpoint
- ❌ No user deletion endpoint
- ❌ No user role assignment
- ❌ Frontend `src/data/users.json` has no API

**Required API Endpoints:**
- `GET /api/users` - List users (admin only)
- `GET /api/users/:id` - Get user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `PUT /api/users/:id/role` - Update user role

---

### 2.8 Reports & Analytics ❌ MEDIUM
**Impact:** MEDIUM - No reporting capabilities

**Missing:**
- ❌ No reports routes
- ❌ No reports controller
- ❌ No analytics endpoints

**Required API Endpoints:**
- `GET /api/reports/orders` - Order reports
- `GET /api/reports/inventory` - Inventory reports
- `GET /api/reports/performance` - Performance reports
- `GET /api/reports/stock-movements` - Stock movement reports

---

### 2.9 Batch & Wave Management ❌ MEDIUM
**Impact:** MEDIUM - Cannot optimize picking operations

**Missing:**
- ❌ No batch routes
- ❌ No wave routes
- ❌ No batch optimization logic
- ❌ No wave release logic

**Required API Endpoints:**
- `GET /api/batches` - List batches
- `POST /api/batches` - Create batch
- `PUT /api/batches/:id/start` - Start batch
- `GET /api/waves` - List waves
- `POST /api/waves` - Create wave
- `PUT /api/waves/:id/release` - Release wave

---

### 2.10 Permissions Enforcement ❌ HIGH
**Impact:** HIGH - Insufficient permission checks

**Issues:**
- ⚠️ `ordersRoutes.js` allows any authenticated user to `pickItem` without role check
- ⚠️ `packOrder` endpoint allows any authenticated user
- ⚠️ No resource-level permissions (can user X modify order Y?)

**Required:**
```javascript
// Fix in ordersRoutes.js
router.put('/:id/pick', authorize('PICKER', 'ADMIN', 'MANAGER'), pickItemValidation, pickItem);
router.put('/:id/pack', authorize('PACKER', 'ADMIN', 'MANAGER'), packOrderValidation, packOrder);

// Add resource ownership checks
export const requireOrderAccess = (req, res, next) => {
  if (req.user.role === 'ADMIN' || req.user.role === 'MANAGER') {
    return next();
  }
  // Check if user has access to this order
  if (req.order.assignedPickerId !== req.user.id && req.order.assignedPackerId !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden', message: 'No access to this order' });
  }
  next();
};
```

---

## 3. DATA CONTRACT MISMATCHES ⚠️

### 3.1 Orders Data Structure
**Issue:** Frontend expects different structure than backend provides

**Frontend Structure (from orders.json):**
```json
{
  "id": "SO4329",
  "customer": { "name": "...", "email": "...", "phone": "..." },
  "status": "pending",
  "items": [{ "sku": "...", "quantity": 5, "location": "A-01-02" }]
}
```

**Backend Schema:**
```javascript
model Order {
  customerName    String  // ✅ Matches
  customerEmail   String  // ✅ Matches
  customerPhone   String  // ✅ Matches
  status          OrderStatus // ✅ Matches
  items          OrderItem[]
}

model OrderItem {
  location       String // ✅ Matches
  // ... other fields
}
```

**Status:** ✅ COMPATIBLE - Backend schema aligns with frontend expectations

---

### 3.2 Order ID Format
**Issue:** Backend uses auto-generated IDs, frontend expects "SO" prefix

**Frontend:** `"id": "SO4329"`  
**Backend:** Auto-generated `SO${Date.now()}` in controller  

**Status:** ⚠️ INCONSISTENT - Need standardized ID generation

**Fix Required:**
```javascript
// Use sequence-based IDs like frontend
const orderId = await generateOrderId(); // SO-2026-00001
```

---

### 3.3 Order Status Values
**Issue:** Case sensitivity mismatch

**Frontend (lowercase):** `"pending"`, `"picking"`, `"ready_to_pack"`  
**Backend (uppercase in schema):** `"PENDING"`, `"PICKING"`, `"READY_TO_PACK"`  
**Backend controller:** Uses `.toUpperCase()` to normalize

**Status:** ✅ HANDLED - Backend normalizes to uppercase

---

### 3.4 Products Data Structure
**Issue:** Frontend expects inventory included in product response

**Frontend Structure (from products.json):**
```json
{
  "sku": "ARM-SENS-001",
  "inventory": 45  // Total quantity across all bins
}
```

**Backend Response:**
```javascript
{
  inventoryItems: [
    { quantity: 45, bin: { code: "A-01-02" } }
  ]
}
```

**Status:** ⚠️ MISMATCH - Frontend expects `inventory` field, backend provides `inventoryItems`

**Fix Required:**
```javascript
// Add computed field in product response
const totalInventory = product.inventoryItems.reduce((sum, item) => sum + item.quantity, 0);
return {
  ...product,
  inventory: totalInventory
};
```

---

### 3.5 Bins Data Structure
**Issue:** Frontend bins.json has different structure than backend schema

**Frontend Structure (from bins.json):**
```json
{
  "id": "A-01-01",
  "zone": "A",
  "row": "01",
  "shelf": "01",
  "type": "small",
  "capacity": 100,
  "currentStock": [{ "sku": "...", "quantity": 45 }]
}
```

**Backend Schema:**
```javascript
model Bin {
  code      String   // Frontend uses "id"
  aisle     String   // Frontend uses "zone"
  row       String   // ✅ Matches
  column    String   // Frontend uses "shelf"
  level     String   // Not in frontend
  capacity  Int?     // ✅ Matches
  // No "type" field
  // No "currentStock" - separate relation
}
```

**Status:** ❌ MISMATCH - Significant schema differences

**Fix Required:**
1. Add `type` field to Bin schema
2. Change `code` to match frontend `id` format
3. Map `aisle` → `zone`, `column` → `shelf`
4. Remove unused `level` field
5. Transform `currentStock` from frontend format to backend InventoryItem relation

---

## 4. SECURITY & VALIDATION GAPS ⚠️

### 4.1 Input Validation
**Status:** ⚠️ PARTIAL

**Present:**
- ✅ Email validation with express-validator
- ✅ Password length validation
- ✅ Required field validation in routes

**Missing:**
- ❌ SKU format validation
- ❌ Barcode format validation (EAN-13, UPC-A)
- ❌ Phone number validation (NZ format)
- ❌ Quantity range validation (no negative numbers)
- ❌ Price validation (no negative prices)
- ❌ Date range validation

**Required:**
```javascript
const productValidation = [
  body('sku').matches(/^[A-Z]{3}-[A-Z]{4}-\d{3}$/).withMessage('Invalid SKU format'),
  body('barcode').isLength({ min: 12, max: 13 }).withMessage('Invalid barcode'),
  body('quantity').isInt({ min: 0 }).withMessage('Quantity cannot be negative'),
  body('price').isFloat({ min: 0 }).withMessage('Price cannot be negative'),
];
```

---

### 4.2 Business Logic Validation
**Status:** ❌ MISSING

**Issues:**
- ❌ No validation that `pickedQuantity` ≤ `quantity` (over-picking possible)
- ❌ No validation that `packedQuantity` ≤ `quantity` (over-packing possible)
- ❌ No inventory availability check before picking
- ❌ No duplicate order detection
- ❌ No invalid status transition prevention

**Required:**
```javascript
// In pickItem endpoint
if (orderItem.pickedQuantity + quantity > orderItem.quantity) {
  return res.status(400).json({
    error: 'ValidationError',
    message: 'Cannot pick more than ordered quantity'
  });
}

// Check inventory availability
const inventory = await prisma.inventoryItem.findFirst({
  where: { productId: product.id, binId: binId }
});
if (!inventory || inventory.quantity < quantity) {
  return res.status(400).json({
    error: 'InsufficientInventory',
    message: 'Not enough inventory in this bin'
  });
}
```

---

### 4.3 Error Responses
**Status:** ⚠️ PARTIAL

**Issues:**
- ✅ Standardized error format in errorHandler
- ✅ Prisma error handling
- ❌ No business error codes defined
- ❌ Error messages not user-friendly in all cases
- ❌ No error localization

---

## 5. INTEGRATION & BACKGROUND JOBS ❌

### 5.1 NetSuite Integration
**Status:** ❌ NOT IMPLEMENTED

**Missing:**
- ❌ No NetSuite adapter
- ❌ No sync jobs
- ❌ No configuration for NetSuite credentials
- ❌ No webhook handling from NetSuite

**Required:**
- `src/integrations/netsuiteAdapter.js`
- `src/jobs/syncOrders.js`
- Environment variables: `NETSUITE_ACCOUNT_ID`, `NETSUITE_CONSUMER_KEY`, etc.

---

### 5.2 Courier Integration
**Status:** ❌ NOT IMPLEMENTED

**Missing:**
- ❌ No courier adapters (NZ Couriers, NZ Post, Mainfreight, Post Haste)
- ❌ No tracking number generation
- ❌ No label printing hooks
- ❌ No shipping cost calculation

**Required:**
- `src/integrations/nzCouriersAdapter.js`
- `src/integrations/nzPostAdapter.js`
- `src/integrations/mainfreightAdapter.js`
- `src/integrations/postHasteAdapter.js`

---

### 5.3 Background Jobs
**Status:** ❌ NOT IMPLEMENTED

**Missing:**
- ❌ No Bull queue setup
- ❌ No Redis configuration
- ❌ No job processors
- ❌ No retry logic
- ❌ No cron schedules

**Required:**
- `src/jobs/queue.js` - Bull queue setup
- `src/jobs/orderSync.js` - Order sync job
- `src/jobs/inventorySync.js` - Inventory sync job
- `src/jobs/notification.js` - Notification job
- Environment variables: `REDIS_URL`, `REDIS_PASSWORD`

---

## 6. TESTING ❌

**Status:** ❌ NO TESTS

**Missing:**
- ❌ No unit tests
- ❌ No integration tests
- ❌ No test database configuration
- ❌ No test data fixtures
- ❌ No test coverage reporting

**Required:**
- Jest test framework
- Supertest for API testing
- Test database (PostgreSQL test instance)
- Test fixtures directory
- Coverage minimum: 80%

---

## 7. DEPLOYMENT & DEVOPS ❌

**Status:** ❌ NOT CONFIGURED

**Missing:**
- ❌ No Docker configuration
- ❌ No Kubernetes manifests
- ❌ No CI/CD pipeline
- ❌ No environment-specific configs
- ❌ No health check endpoints (only basic `/health`)
- ❌ No monitoring/metrics (Prometheus, Grafana)
- ❌ No APM (Application Performance Monitoring)

---

## 8. DOCUMENTATION ⚠️

**Status:** ⚠️ PARTIAL

**Present:**
- ✅ backend-contract.md (comprehensive)
- ✅ non-negotiables.md (binding rules)
- ✅ README.md (basic)

**Missing:**
- ❌ No API documentation (Swagger/OpenAPI)
- ❌ No deployment guide
- ❌ No developer onboarding guide
- ❌ No integration guide
- ❌ No troubleshooting guide

---

## 9. PERFORMANCE OPTIMIZATION ❌

**Status:** ❌ NOT OPTIMIZED

**Issues:**
- ❌ No query optimization
- ❌ No caching layer (Redis)
- ❌ No database connection pooling configuration
- ❌ No pagination validation (client can request 1M records)
- ❌ No response compression
- ❌ No query result size limits

---

## 10. SUMMARY TABLE

| Module | Status | Priority | Est. Effort |
|--------|--------|----------|-------------|
| Auth & Accounts | ✅ Complete | - | - |
| Organization/Site Management | ❌ Missing | CRITICAL | 40h |
| Plan Enforcement | ❌ Missing | CRITICAL | 32h |
| Orders & Picking | ✅ Complete | - | - |
| Products & Inventory | ✅ Complete | - | - |
| Bins Management | ❌ Missing | CRITICAL | 16h |
| Purchase Orders | ❌ Missing | HIGH | 24h |
| Returns | ❌ Missing | HIGH | 16h |
| Stock Takes | ❌ Missing | HIGH | 20h |
| User Management | ❌ Missing | MEDIUM | 12h |
| Reports | ❌ Missing | MEDIUM | 24h |
| Batch/Wave | ❌ Missing | MEDIUM | 32h |
| Permissions Fix | ⚠️ Partial | HIGH | 8h |
| Validation | ⚠️ Partial | HIGH | 16h |
| NetSuite Integration | ❌ Missing | MEDIUM | 40h |
| Courier Integration | ❌ Missing | MEDIUM | 32h |
| Background Jobs | ❌ Missing | MEDIUM | 24h |
| Testing | ❌ Missing | HIGH | 40h |
| Documentation | ⚠️ Partial | LOW | 24h |
| Performance | ❌ Missing | MEDIUM | 16h |

**Total Estimated Effort:** ~416 hours

---

## 11. CRITICAL PATH TO PRODUCTION

### Phase 1: Foundation (CRITICAL - 88h)
1. ✅ Implement Organization/Site Management (40h)
2. ✅ Implement Plan/Billing Enforcement (32h)
3. ✅ Create Bins API (16h)

### Phase 2: Core Features (HIGH - 72h)
4. ✅ Implement Purchase Orders API (24h)
5. ✅ Implement Returns API (16h)
6. ✅ Implement Stock Takes API (20h)
7. ✅ Fix Permission Gaps (8h)
8. ✅ Add Comprehensive Validation (16h)

### Phase 3: Production Readiness (HIGH - 88h)
9. ✅ Implement Testing Suite (40h)
10. ✅ Fix Data Contract Mismatches (16h)
11. ✅ Add Performance Optimization (16h)
12. ✅ Complete Documentation (24h)

### Phase 4: Advanced Features (MEDIUM - 168h)
13. ✅ User Management API (12h)
14. ✅ Reports API (24h)
15. ✅ Batch/Wave Management (32h)
16. ✅ NetSuite Integration (40h)
17. ✅ Courier Integration (32h)
18. ✅ Background Jobs (24h)

---

## 12. RECOMMENDATIONS

### Immediate Actions (Week 1):
1. **STOP** - Do not proceed with new features
2. Implement Organization/Site Management models and APIs
3. Implement Plan Enforcement middleware
4. Create Bins API endpoint
5. Fix permission gaps in orders routes

### Short-term Goals (Week 2-4):
6. Implement Purchase Orders, Returns, Stock Takes APIs
7. Add comprehensive business logic validation
8. Write integration tests for critical paths
9. Fix data contract mismatches

### Medium-term Goals (Week 5-8):
10. Implement batch and wave picking optimization
11. Add NetSuite integration
12. Add courier integrations
13. Implement background job queue
14. Add performance monitoring

### Long-term Goals (Week 9-12):
15. Achieve 80% test coverage
16. Complete API documentation with Swagger
17. Set up CI/CD pipeline
18. Implement comprehensive logging and monitoring

---

## 13. RISKS & ASSUMPTIONS

### Risks:
1. **Timeline Risk:** 416 hours is significant - may exceed project timeline
2. **Integration Risk:** NetSuite and courier integrations are complex and may require extensive testing
3. **Data Migration Risk:** Migrating from frontend JSON to backend API may break existing functionality
4. **Performance Risk:** Without caching and optimization, system may not scale

### Assumptions:
1. Frontend data contracts in JSON files are reference and will not be modified
2. PostgreSQL is the preferred database
3. Single-region deployment (New Zealand)
4. NetSuite and courier APIs are available and documented

---

## 14. NEXT STEPS

1. **Review this audit** with stakeholders
2. **Approve critical path** and timeline
3. **Begin Phase 1** - Organization/Site Management
4. **Set up MCP tools** for parallel development
5. **Create detailed task breakdown** for Phase 1

---

**Audit Complete**  
**Total Gaps Identified:** 18 critical/high priority items  
**Estimated Time to Production:** 248 hours (critical + high priority only)
