/**
 * ERROR CODE TAXONOMY
 * 
 * Centralized error codes for consistency across the entire system.
 * Format: MODULE_001_DESCRIPTION
 * 
 * Categories:
 * - AUTH: Authentication and authorization errors
 * - PLAN: Plan limit and billing errors
 * - INV: Inventory management errors
 * - ORD: Order processing errors
 * - PICK: Picking operations errors
 * - USER: User management errors
 * - SITE: Site/warehouse management errors
 * - VAL: Input validation errors
 * - DB: Database operation errors
 * - SYS: System-level errors
 */

export const ERROR_CODES = {
  // AUTHENTICATION & AUTHORIZATION (AUTH_XXX)
  AUTH_001_INVALID_TOKEN: {
    code: 'AUTH_001',
    message: 'Invalid or expired authentication token',
    httpStatus: 401,
    category: 'AUTH',
  },
  AUTH_002_MISSING_TOKEN: {
    code: 'AUTH_002',
    message: 'Authentication token required',
    httpStatus: 401,
    category: 'AUTH',
  },
  AUTH_003_INVALID_CREDENTIALS: {
    code: 'AUTH_003',
    message: 'Invalid email or password',
    httpStatus: 401,
    category: 'AUTH',
  },
  AUTH_003_UNAUTHORIZED: {
    code: 'AUTH_003',
    message: 'Unauthorized access',
    httpStatus: 403,
    category: 'AUTH',
  },
  AUTH_004_FORBIDDEN: {
    code: 'AUTH_004',
    message: 'Insufficient permissions for this action',
    httpStatus: 403,
    category: 'AUTH',
  },
  AUTH_005_TOKEN_EXPIRED: {
    code: 'AUTH_005',
    message: 'Token has expired',
    httpStatus: 401,
    category: 'AUTH',
  },

  // PLAN LIMITS (PLAN_XXX)
  PLAN_001_PLAN_NOT_FOUND: {
    code: 'PLAN_001',
    message: 'Plan not found',
    httpStatus: 404,
    category: 'PLAN',
  },
  PLAN_002_PLAN_UPGRADE_REQUIRED: {
    code: 'PLAN_002',
    message: 'This feature requires a higher plan',
    httpStatus: 403,
    category: 'PLAN',
  },
  PLAN_003_USER_LIMIT_EXCEEDED: {
    code: 'PLAN_003',
    message: 'User limit exceeded for current plan',
    httpStatus: 403,
    category: 'PLAN',
  },
  PLAN_004_SITE_LIMIT_EXCEEDED: {
    code: 'PLAN_004',
    message: 'Site limit exceeded for current plan',
    httpStatus: 403,
    category: 'PLAN',
  },
  PLAN_005_FEATURE_NOT_AVAILABLE: {
    code: 'PLAN_005',
    message: 'Feature not available in current plan',
    httpStatus: 403,
    category: 'PLAN',
  },

  // INVENTORY (INV_XXX)
  INV_001_PRODUCT_NOT_FOUND: {
    code: 'INV_001',
    message: 'Product not found',
    httpStatus: 404,
    category: 'INV',
  },
  INV_002_INSUFFICIENT_STOCK: {
    code: 'INV_002',
    message: 'Insufficient stock quantity',
    httpStatus: 400,
    category: 'INV',
  },
  INV_003_BIN_NOT_FOUND: {
    code: 'INV_003',
    message: 'Bin not found',
    httpStatus: 404,
    category: 'INV',
  },
  INV_004_BIN_CAPACITY_EXCEEDED: {
    code: 'INV_004',
    message: 'Bin capacity exceeded',
    httpStatus: 400,
    category: 'INV',
  },
  INV_005_DUPLICATE_SKU: {
    code: 'INV_005',
    message: 'SKU already exists',
    httpStatus: 409,
    category: 'INV',
  },
  INV_006_INVALID_BARCODE: {
    code: 'INV_006',
    message: 'Invalid barcode format',
    httpStatus: 400,
    category: 'INV',
  },
  INV_007_BARCODE_ALREADY_ASSIGNED: {
    code: 'INV_007',
    message: 'Barcode already assigned to another product',
    httpStatus: 409,
    category: 'INV',
  },

  // ORDERS (ORD_XXX)
  ORD_001_ORDER_NOT_FOUND: {
    code: 'ORD_001',
    message: 'Order not found',
    httpStatus: 404,
    category: 'ORD',
  },
  ORD_002_INVALID_ORDER_STATUS: {
    code: 'ORD_002',
    message: 'Invalid order status transition',
    httpStatus: 400,
    category: 'ORD',
  },
  ORD_003_ORDER_ALREADY_FULFILLED: {
    code: 'ORD_003',
    message: 'Order already fulfilled',
    httpStatus: 400,
    category: 'ORD',
  },
  ORD_004_ORDER_CANNOT_BE_CANCELLED: {
    code: 'ORD_004',
    message: 'Order cannot be cancelled in current status',
    httpStatus: 400,
    category: 'ORD',
  },
  ORD_005_INVALID_PICK_QUANTITY: {
    code: 'ORD_005',
    message: 'Pick quantity exceeds order quantity',
    httpStatus: 400,
    category: 'ORD',
  },
  ORD_006_PRODUCT_MISMATCH: {
    code: 'ORD_006',
    message: 'Product does not match order item',
    httpStatus: 400,
    category: 'ORD',
  },

  // PICKING (PICK_XXX)
  PICK_001_PICK_LIST_NOT_FOUND: {
    code: 'PICK_001',
    message: 'Pick list not found',
    httpStatus: 404,
    category: 'PICK',
  },
  PICK_002_OVER_PICK_NOT_ALLOWED: {
    code: 'PICK_002',
    message: 'Over-picking not allowed',
    httpStatus: 400,
    category: 'PICK',
  },
  PICK_003_PICK_ALREADY_COMPLETED: {
    code: 'PICK_003',
    message: 'Pick item already completed',
    httpStatus: 400,
    category: 'PICK',
  },
  PICK_004_INVALID_SCAN: {
    code: 'PICK_004',
    message: 'Invalid barcode scan',
    httpStatus: 400,
    category: 'PICK',
  },

  // USER MANAGEMENT (USER_XXX)
  USER_001_USER_NOT_FOUND: {
    code: 'USER_001',
    message: 'User not found',
    httpStatus: 404,
    category: 'USER',
  },
  USER_002_EMAIL_ALREADY_EXISTS: {
    code: 'USER_002',
    message: 'Email already registered',
    httpStatus: 409,
    category: 'USER',
  },
  USER_003_INVALID_ROLE: {
    code: 'USER_003',
    message: 'Invalid user role',
    httpStatus: 400,
    category: 'USER',
  },
  USER_004_USER_ALREADY_ASSIGNED: {
    code: 'USER_004',
    message: 'User already assigned to this site',
    httpStatus: 409,
    category: 'USER',
  },

  // SITE MANAGEMENT (SITE_XXX)
  SITE_001_SITE_NOT_FOUND: {
    code: 'SITE_001',
    message: 'Site not found',
    httpStatus: 404,
    category: 'SITE',
  },
  SITE_002_ORGANIZATION_NOT_FOUND: {
    code: 'SITE_002',
    message: 'Organization not found',
    httpStatus: 404,
    category: 'SITE',
  },
  SITE_003_SITE_ALREADY_EXISTS: {
    code: 'SITE_003',
    message: 'Site with this name already exists',
    httpStatus: 409,
    category: 'SITE',
  },

  // VALIDATION (VAL_XXX)
  VAL_001_MISSING_REQUIRED_FIELD: {
    code: 'VAL_001',
    message: 'Required field is missing',
    httpStatus: 400,
    category: 'VAL',
  },
  VAL_002_INVALID_EMAIL_FORMAT: {
    code: 'VAL_002',
    message: 'Invalid email format',
    httpStatus: 400,
    category: 'VAL',
  },
  VAL_003_INVALID_PHONE_FORMAT: {
    code: 'VAL_003',
    message: 'Invalid phone format',
    httpStatus: 400,
    category: 'VAL',
  },
  VAL_004_INVALID_QUANTITY: {
    code: 'VAL_004',
    message: 'Quantity must be positive',
    httpStatus: 400,
    category: 'VAL',
  },
  VAL_005_FIELD_TOO_LONG: {
    code: 'VAL_005',
    message: 'Field exceeds maximum length',
    httpStatus: 400,
    category: 'VAL',
  },

  // DATABASE (DB_XXX)
  DB_001_CONNECTION_FAILED: {
    code: 'DB_001',
    message: 'Database connection failed',
    httpStatus: 503,
    category: 'DB',
  },
  DB_002_QUERY_FAILED: {
    code: 'DB_002',
    message: 'Database query failed',
    httpStatus: 500,
    category: 'DB',
  },
  DB_003_TRANSACTION_FAILED: {
    code: 'DB_003',
    message: 'Database transaction failed',
    httpStatus: 500,
    category: 'DB',
  },
  DB_004_CONSTRAINT_VIOLATION: {
    code: 'DB_004',
    message: 'Database constraint violation',
    httpStatus: 409,
    category: 'DB',
  },

  // SYSTEM (SYS_XXX)
  SYS_001_INTERNAL_ERROR: {
    code: 'SYS_001',
    message: 'Internal server error',
    httpStatus: 500,
    category: 'SYS',
  },
  SYS_002_SERVICE_UNAVAILABLE: {
    code: 'SYS_002',
    message: 'Service temporarily unavailable',
    httpStatus: 503,
    category: 'SYS',
  },
  SYS_003_RATE_LIMIT_EXCEEDED: {
    code: 'SYS_003',
    message: 'Rate limit exceeded',
    httpStatus: 429,
    category: 'SYS',
  },
};

/**
 * Get error code object
 */
export function getErrorCode(errorKey) {
  return ERROR_CODES[errorKey] || ERROR_CODES.SYS_001_INTERNAL_ERROR;
}

/**
 * Format error response
 */
export function formatErrorResponse(errorKey, customMessage = null, details = null) {
  const error = getErrorCode(errorKey);
  
  return {
    error: error.code,
    message: customMessage || error.message,
    statusCode: error.httpStatus,
    category: error.category,
    ...(details && { details }),
  };
}

/**
 * Check if error is recoverable
 */
export function isRecoverableError(errorKey) {
  const error = getErrorCode(errorKey);
  return error.httpStatus < 500;
}
