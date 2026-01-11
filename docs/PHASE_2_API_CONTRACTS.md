# Phase 2: API Contracts - Locked and Final
**Status:** ✅ LOCKED - No changes permitted without stakeholder approval
**Version:** 1.0.0
**Date:** 2026-01-05

---

## Contract Rules

1. **All API responses** must follow standard format
2. **All endpoints** must include authentication unless marked PUBLIC
3. **All errors** must use standardized error codes
4. **No breaking changes** allowed in minor versions
5. **All timestamps** must be ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)

---

## Standard Response Formats

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

### Error Response
```json
{
  "success": false,
  "error": "ErrorCode",
  "message": "Human-readable error message",
  "details": { ... }
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "pages": 3
  }
}
```

---

## API Endpoints

### 1. AUTHENTICATION & AUTH

#### POST /api/auth/register
**PUBLIC**
**Description:** Register new user
**Plan Check:** Enforces user limit

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe",
  "role": "STAFF",
  "companyName": "Example Company",  // Optional - creates new company
  "siteCode": "AUK01"  // Optional - assigns to site
}
```

**Response:** 201 Created
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "STAFF",
      "companyId": "uuid",
      "siteId": "uuid"
    },
    "token": "jwt_token_here"
  }
}
```

**Errors:**
- `ValidationError` - Invalid input
- `PlanLimitReached` - Company user limit exceeded
- `EmailAlreadyExists` - Email already registered

---

#### POST /api/auth/login
**PUBLIC**

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "STAFF",
      "company": {
        "id": "uuid",
        "name": "Example Company",
        "plan": "STARTER"
      },
      "site": {
        "id": "uuid",
        "name": "Auckland Warehouse",
        "code": "AUK01"
      }
    },
    "token": "jwt_token_here"
  }
}
```

---

#### GET /api/auth/me
**AUTHENTICATED**

**Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "STAFF",
    "level": 5,
    "xp": 4500,
    "xpToNextLevel": 5000,
    "avatar": "https://...",
    "department": "Picking",
    "company": {
      "id": "uuid",
      "name": "Example Company",
      "plan": "STARTER",
      "status": "ACTIVE"
    },
    "site": {
      "id": "uuid",
      "name": "Auckland Warehouse",
      "code": "AUK01"
    },
    "stats": {
      "ordersProcessed": 150,
      "itemsPicked": 450,
      "itemsPacked": 400,
      "accuracy": 98.5,
      "averagePickTime": 120
    }
  }
}
```

---

### 2. COMPANIES

#### POST /api/companies
**AUTHENTICATED** - ADMIN/MANAGER only
**Plan Check:** None (creates new company)

**Request Body:**
```json
{
  "name": "Example Company",
  "plan": "STARTER"
}
```

**Response:** 201 Created
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Example Company",
    "plan": "STARTER",
    "status": "ACTIVE",
    "createdAt": "2026-01-05T00:00:00.000Z"
  }
}
```

---

#### GET /api/companies/:id
**AUTHENTICATED** - ADMIN/MANAGER only

**Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Example Company",
    "plan": "STARTER",
    "status": "ACTIVE",
    "createdAt": "2026-01-05T00:00:00.000Z",
    "updatedAt": "2026-01-05T00:00:00.000Z",
    "usage": {
      "users": {
        "current": 12,
        "limit": 15,
        "remaining": 3,
        "percentage": 80
      },
      "sites": {
        "current": 1,
        "limit": 2,
        "remaining": 1,
        "percentage": 50
      }
    }
  }
}
```

---

#### PUT /api/companies/:id/plan
**AUTHENTICATED** - ADMIN only

**Request Body:**
```json
{
  "plan": "PRO"
}
```

**Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Example Company",
    "plan": "PRO",
    "status": "ACTIVE"
  }
}
```

---

### 3. SITES

#### POST /api/sites
**AUTHENTICATED** - ADMIN/MANAGER
**Plan Check:** Enforces site limit

**Request Body:**
```json
{
  "code": "AUK01",
  "name": "Auckland Warehouse",
  "address": {
    "street": "123 Queen Street",
    "city": "Auckland",
    "postcode": "1010",
    "country": "New Zealand"
  },
  "isActive": true
}
```

**Response:** 201 Created
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "code": "AUK01",
    "name": "Auckland Warehouse",
    "address": {
      "street": "123 Queen Street",
      "city": "Auckland",
      "postcode": "1010",
      "country": "New Zealand"
    },
    "isActive": true,
    "createdAt": "2026-01-05T00:00:00.000Z"
  }
}
```

**Errors:**
- `PlanLimitReached` - Site limit exceeded

---

#### GET /api/sites
**AUTHENTICATED**

**Query Params:**
- `active=true` - Filter by active status (default: true)
- `page=1` - Page number
- `limit=50` - Items per page (max: 100)

**Response:** 200 OK
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "code": "AUK01",
      "name": "Auckland Warehouse",
      "address": { ... },
      "isActive": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 2,
    "pages": 1
  }
}
```

---

#### GET /api/sites/:id
**AUTHENTICATED**

**Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "code": "AUK01",
    "name": "Auckland Warehouse",
    "address": { ... },
    "isActive": true,
    "createdAt": "2026-01-05T00:00:00.000Z",
    "updatedAt": "2026-01-05T00:00:00.000Z"
  }
}
```

---

### 4. USERS

#### GET /api/users
**AUTHENTICATED** - ADMIN/MANAGER only

**Query Params:**
- `role=PICKER` - Filter by role
- `siteId=uuid` - Filter by site
- `page=1` - Page number
- `limit=50` - Items per page

**Response:** 200 OK
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "PICKER",
      "level": 5,
      "xp": 4500,
      "department": "Picking",
      "site": {
        "id": "uuid",
        "name": "Auckland Warehouse",
        "code": "AUK01"
      },
      "createdAt": "2026-01-05T00:00:00.000Z"
    }
  ],
  "pagination": { ... }
}
```

---

#### POST /api/users
**AUTHENTICATED** - ADMIN/MANAGER
**Plan Check:** Enforces user limit

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "SecurePass123!",
  "name": "Jane Smith",
  "role": "PICKER",
  "department": "Picking",
  "siteId": "uuid"
}
```

**Response:** 201 Created
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "newuser@example.com",
    "name": "Jane Smith",
    "role": "PICKER",
    "department": "Picking",
    "siteId": "uuid",
    "createdAt": "2026-01-05T00:00:00.000Z"
  }
}
```

**Errors:**
- `PlanLimitReached` - User limit exceeded

---

#### PUT /api/users/:id
**AUTHENTICATED** - ADMIN/MANAGER or own account

**Request Body:**
```json
{
  "name": "Jane Doe",
  "department": "Packing",
  "siteId": "uuid"
}
```

**Response:** 200 OK

---

#### PUT /api/users/:id/role
**AUTHENTICATED** - ADMIN only

**Request Body:**
```json
{
  "role": "MANAGER"
}
```

**Response:** 200 OK

---

### 5. BINS

#### GET /api/bins
**AUTHENTICATED**

**Query Params:**
- `code=AUK01` - Filter by bin code pattern
- `zone=A` - Filter by zone (aisle)
- `type=small` - Filter by type
- `page=1`, `limit=50`

**Response:** 200 OK
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "code": "A-01-01",
      "zone": "A",
      "row": "01",
      "column": "01",
      "level": null,
      "type": "small",
      "capacity": 100,
      "isAvailable": true,
      "currentStock": [
        {
          "sku": "ARM-SENS-001",
          "quantity": 45
        }
      ]
    }
  ],
  "pagination": { ... }
}
```

---

#### GET /api/bins/:id
**AUTHENTICATED**

**Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "code": "A-01-01",
    "zone": "A",
    "row": "01",
    "column": "01",
    "level": null,
    "type": "small",
    "capacity": 100,
    "isAvailable": true,
    "currentStock": [
      {
        "sku": "ARM-SENS-001",
        "quantity": 45,
        "productName": "PIR Motion Sensor",
        "lastUpdated": "2026-01-05T00:00:00.000Z"
      }
    ],
    "createdAt": "2026-01-05T00:00:00.000Z",
    "updatedAt": "2026-01-05T00:00:00.000Z"
  }
}
```

---

#### GET /api/bins/:code
**AUTHENTICATED**
**Description:** Get bin by code (e.g., "A-01-01")

**Response:** Same as GET /api/bins/:id

---

### 6. ORDERS

#### GET /api/orders
**AUTHENTICATED**

**Query Params:**
- `status=PENDING` - Filter by status
- `priority=URGENT` - Filter by priority
- `assignedPickerId=uuid` - Filter by picker
- `assignedPackerId=uuid` - Filter by packer
- `siteId=uuid` - Filter by site
- `startDate=2026-01-01` - Filter by date range
- `endDate=2026-01-31`
- `page=1`, `limit=50`

**Response:** 200 OK
```json
{
  "success": true,
  "data": [
    {
      "id": "SO4329",
      "customer": {
        "name": "Auckland Security Services",
        "email": "orders@aucklandsec.co.nz",
        "phone": "+64 9 555 1234"
      },
      "status": "PENDING",
      "priority": "OVERNIGHT",
      "createdAt": "2026-01-02T08:30:00.000Z",
      "requiredBy": "2026-01-03T17:00:00.000Z",
      "assignedPicker": null,
      "assignedPacker": null,
      "siteId": "uuid",
      "site": {
        "id": "uuid",
        "name": "Auckland Warehouse",
        "code": "AUK01"
      },
      "shippingAddress": {
        "street": "123 Queen Street",
        "city": "Auckland",
        "postcode": "1010",
        "country": "New Zealand"
      },
      "packageType": null,
      "trackingNumber": null,
      "notes": "Customer will collect if ready early",
      "items": [
        {
          "id": "uuid",
          "sku": "ARM-SENS-001",
          "name": "PIR Motion Sensor",
          "barcode": "9421234567890",
          "quantity": 5,
          "pickedQuantity": 0,
          "packedQuantity": 0,
          "location": "A-01-02"
        }
      ]
    }
  ],
  "pagination": { ... }
}
```

---

#### POST /api/orders
**AUTHENTICATED** - ADMIN/MANAGER

**Request Body:**
```json
{
  "id": "SO4338",
  "customer": {
    "name": "Customer Name",
    "email": "customer@example.com",
    "phone": "+64 9 555 0000"
  },
  "priority": "NORMAL",
  "requiredBy": "2026-01-10T17:00:00.000Z",
  "siteId": "uuid",
  "shippingAddress": {
    "street": "123 Street",
    "city": "Auckland",
    "postcode": "1010",
    "country": "New Zealand"
  },
  "notes": "Optional notes",
  "items": [
    {
      "sku": "ARM-SENS-001",
      "quantity": 5,
      "location": "A-01-02"
    }
  ]
}
```

**Response:** 201 Created

---

#### PUT /api/orders/:id/assign-picker
**AUTHENTICATED** - ADMIN/MANAGER

**Request Body:**
```json
{
  "assignedPickerId": "uuid"
}
```

**Response:** 200 OK

---

#### PUT /api/orders/:id/pick
**AUTHENTICATED** - PICKER/ADMIN/MANAGER
**Description:** Pick item from order

**Request Body:**
```json
{
  "itemId": "uuid",
  "binCode": "A-01-02",
  "quantity": 2
}
```

**Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "itemId": "uuid",
    "pickedQuantity": 2,
    "remaining": 3
  }
}
```

**Errors:**
- `ValidationError` - Cannot pick more than ordered
- `InsufficientInventory` - Not enough inventory in bin
- `Forbidden` - Not assigned to this order

---

#### PUT /api/orders/:id/pack
**AUTHENTICATED** - PACKER/ADMIN/MANAGER

**Request Body:**
```json
{
  "packageType": "0.03",
  "courier": "NZPOST"
}
```

**Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "trackingNumber": "NZ123456789",
    "packedAt": "2026-01-05T12:00:00.000Z"
  }
}
```

---

### 7. PRODUCTS

#### GET /api/products
**AUTHENTICATED**

**Query Params:**
- `sku=ARM-SENS-001` - Filter by SKU
- `barcode=9421234567890` - Filter by barcode
- `category=Sensors` - Filter by category
- `lowStock=true` - Filter by low stock
- `page=1`, `limit=50`

**Response:** 200 OK
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "sku": "ARM-SENS-001",
      "name": "PIR Motion Sensor",
      "description": "Passive infrared motion detector",
      "category": "Sensors",
      "price": 45.00,
      "weight": 0.15,
      "dimensions": {
        "length": 10,
        "width": 8,
        "height": 5
      },
      "image": "https://...",
      "barcode": "9421234567890",
      "reorderPoint": 50,
      "reorderQuantity": 200,
      "supplier": "TechSense Ltd",
      "inventory": 150,
      "inventoryItems": [
        {
          "binCode": "A-01-01",
          "quantity": 45
        },
        {
          "binCode": "A-01-02",
          "quantity": 105
        }
      ],
      "isLowStock": false,
      "createdAt": "2026-01-05T00:00:00.000Z"
    }
  ],
  "pagination": { ... }
}
```

---

### 8. PURCHASE ORDERS (INWARDS)

#### GET /api/purchase-orders
**AUTHENTICATED**

**Query Params:**
- `status=PENDING` - Filter by status
- `page=1`, `limit=50`

**Response:** 200 OK
```json
{
  "success": true,
  "data": [
    {
      "id": "PO1234",
      "supplierName": "TechSense Ltd",
      "supplierEmail": "orders@techsense.co.nz",
      "supplierPhone": "+64 9 555 0000",
      "status": "PENDING",
      "createdAt": "2026-01-05T00:00:00.000Z",
      "receivedAt": null,
      "assignedReceiverId": null,
      "items": [
        {
          "id": "uuid",
          "sku": "ARM-SENS-001",
          "name": "PIR Motion Sensor",
          "quantityOrdered": 200,
          "quantityReceived": 0
        }
      ]
    }
  ],
  "pagination": { ... }
}
```

---

#### POST /api/purchase-orders
**AUTHENTICATED** - ADMIN/MANAGER/RECEIVER

**Request Body:**
```json
{
  "id": "PO1235",
  "supplierName": "TechSense Ltd",
  "supplierEmail": "orders@techsense.co.nz",
  "supplierPhone": "+64 9 555 0000",
  "notes": "Urgent delivery",
  "items": [
    {
      "sku": "ARM-SENS-001",
      "quantityOrdered": 200
    }
  ]
}
```

**Response:** 201 Created

---

#### PUT /api/purchase-orders/:id/receive
**AUTHENTICATED** - RECEIVER/ADMIN/MANAGER

**Request Body:**
```json
{
  "itemId": "uuid",
  "binCode": "A-01-01",
  "quantity": 200
}
```

**Response:** 200 OK

---

### 9. RETURNS

#### GET /api/returns
**AUTHENTICATED**

**Query Params:**
- `status=PENDING` - Filter by status
- `orderId=SO4329` - Filter by order
- `page=1`, `limit=50`

**Response:** 200 OK
```json
{
  "success": true,
  "data": [
    {
      "id": "RT001",
      "orderId": "SO4329",
      "customerName": "Customer Name",
      "customerEmail": "customer@example.com",
      "customerPhone": "+64 9 555 0000",
      "status": "PENDING",
      "reason": "Damaged on delivery",
      "createdAt": "2026-01-05T00:00:00.000Z",
      "processedAt": null,
      "notes": null
    }
  ],
  "pagination": { ... }
}
```

---

#### POST /api/returns
**AUTHENTICATED**

**Request Body:**
```json
{
  "orderId": "SO4329",
  "customerName": "Customer Name",
  "customerEmail": "customer@example.com",
  "customerPhone": "+64 9 555 0000",
  "reason": "Damaged on delivery",
  "notes": "Optional notes"
}
```

**Response:** 201 Created

---

#### PUT /api/returns/:id/approve
**AUTHENTICATED** - ADMIN/MANAGER

**Response:** 200 OK

---

### 10. STOCK TAKES

#### GET /api/stock-takes
**AUTHENTICATED**

**Query Params:**
- `status=PENDING` - Filter by status
- `page=1`, `limit=50`

**Response:** 200 OK
```json
{
  "success": true,
  "data": [
    {
      "id": "ST2026-001",
      "name": "Monthly Stock Take - January 2026",
      "status": "IN_PROGRESS",
      "scheduledFor": "2026-01-31T00:00:00.000Z",
      "startedAt": "2026-01-05T00:00:00.000Z",
      "completedAt": null,
      "notes": "Full inventory count",
      "items": [
        {
          "id": "uuid",
          "sku": "ARM-SENS-001",
          "binCode": "A-01-01",
          "expectedQty": 45,
          "actualQty": 42,
          "variance": -3
        }
      ]
    }
  ],
  "pagination": { ... }
}
```

---

#### POST /api/stock-takes
**AUTHENTICATED** - ADMIN/MANAGER

**Request Body:**
```json
{
  "name": "Monthly Stock Take",
  "scheduledFor": "2026-01-31T00:00:00.000Z",
  "notes": "Full inventory count"
}
```

**Response:** 201 Created

---

#### PUT /api/stock-takes/:id/start
**AUTHENTICATED** - ADMIN/MANAGER

**Response:** 200 OK

---

#### PUT /api/stock-takes/:id/items/:itemId
**AUTHENTICATED** - STAFF/ADMIN/MANAGER

**Request Body:**
```json
{
  "actualQty": 42
}
```

**Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "expectedQty": 45,
    "actualQty": 42,
    "variance": -3
  }
}
```

---

## Standard Error Codes

| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| `Unauthorized` | 401 | No valid token provided |
| `Forbidden` | 403 | Insufficient permissions |
| `NotFound` | 404 | Resource not found |
| `ValidationError` | 400 | Invalid input data |
| `Conflict` | 409 | Resource already exists |
| `PlanLimitReached` | 403 | Plan limit exceeded |
| `FeatureNotAvailable` | 403 | Feature not in plan |
| `InsufficientInventory` | 400 | Not enough inventory |
| `InvalidTransition` | 400 | Invalid status change |
| `InternalError` | 500 | Server error |

---

## Pagination Rules

- Default `limit`: 50 items
- Maximum `limit`: 100 items
- `page` starts at 1
- All list endpoints must return pagination metadata
- Pagination metadata must include: `page`, `limit`, `total`, `pages`

---

## Filtering & Sorting

- All list endpoints must support filtering
- Common filters: `status`, `date ranges`, `ID patterns`
- Sort format: `sortBy=field&sortOrder=asc|desc`
- Default sort: `createdAt DESC`

---

## Rate Limiting

- Standard endpoints: 100 requests/minute
- Auth endpoints: 10 requests/minute
- Public endpoints: 50 requests/minute

---

## Versioning

- Current version: `/api/v1/...` (or just `/api/...`)
- Breaking changes: Increment major version
- New features: Increment minor version
- Bug fixes: Increment patch version

---

**Contract Status:** ✅ LOCKED  
**Next Review:** After Phase 3 completion
