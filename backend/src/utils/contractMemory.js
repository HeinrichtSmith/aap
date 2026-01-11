/**
 * CONTRACT-FIRST MEMORY SYSTEM
 * 
 * This module provides read-only access to system contracts that MUST be
 * re-read before any code changes. This prevents:
 * - Hallucinating fields that don't exist
 * - Breaking frontend contracts silently
 * - Drifting schemas over time
 * 
 * CRITICAL RULE: Before writing ANY code, you MUST read the relevant contract.
 */

import { readFileSync } from 'fs';
import { join } from 'path';

// Database schema (Prisma)
export const DB_SCHEMA = {
  models: {
    // Authentication & Users
    User: {
      fields: {
        id: 'String UUID',
        email: 'String unique',
        passwordHash: 'String',
        firstName: 'String',
        lastName: 'String',
        role: 'Enum (ADMIN, MANAGER, OPERATOR, VIEWER)',
        organizationId: 'String UUID FK',
        isActive: 'Boolean',
        createdAt: 'DateTime',
        updatedAt: 'DateTime',
      },
    },
    Organization: {
      fields: {
        id: 'String UUID',
        name: 'String unique',
        plan: 'Enum (STARTER, PRO, ELITE)',
        billingEmail: 'String',
        isActive: 'Boolean',
        createdAt: 'DateTime',
        updatedAt: 'DateTime',
      },
    },
    UserSite: {
      fields: {
        id: 'String UUID',
        userId: 'String UUID FK',
        siteId: 'String UUID FK',
        role: 'Enum (ADMIN, MANAGER, OPERATOR)',
        assignedAt: 'DateTime',
      },
    },
    
    // Sites & Warehouses
    Site: {
      fields: {
        id: 'String UUID',
        organizationId: 'String UUID FK',
        name: 'String',
        address: 'String',
        city: 'String',
        country: 'String',
        isActive: 'Boolean',
        createdAt: 'DateTime',
        updatedAt: 'DateTime',
      },
    },
    
    // Products & Inventory
    Product: {
      fields: {
        id: 'String UUID',
        siteId: 'String UUID FK',
        sku: 'String unique',
        name: 'String',
        description: 'String',
        category: 'String',
        unitCost: 'Decimal',
        retailPrice: 'Decimal',
        barcode: 'String unique',
        barcodeType: 'Enum (EAN13, UPC_A, CODE128)',
        weight: 'Float',
        dimensions: 'String JSON',
        imageUrl: 'String',
        isActive: 'Boolean',
        createdAt: 'DateTime',
        updatedAt: 'DateTime',
      },
    },
    Bin: {
      fields: {
        id: 'String UUID',
        siteId: 'String UUID FK',
        name: 'String',
        location: 'String',
        zone: 'String',
        aisle: 'String',
        shelf: 'String',
        capacity: 'Int',
        type: 'Enum (STORAGE, PICKING, RECEIVING, SHIPPING)',
        isActive: 'Boolean',
        createdAt: 'DateTime',
        updatedAt: 'DateTime',
      },
    },
    Inventory: {
      fields: {
        id: 'String UUID',
        productId: 'String UUID FK',
        binId: 'String UUID FK',
        quantity: 'Int',
        quantityAllocated: 'Int',
        quantityAvailable: 'Int',
        lastStockTake: 'DateTime',
        createdAt: 'DateTime',
        updatedAt: 'DateTime',
      },
    },
    
    // Orders
    Order: {
      fields: {
        id: 'String UUID',
        siteId: 'String UUID FK',
        orderNumber: 'String unique',
        customerId: 'String',
        customerName: 'String',
        customerEmail: 'String',
        customerPhone: 'String',
        shippingAddress: 'String JSON',
        status: 'Enum (PENDING, PICKING, PICKED, PACKING, PACKED, SHIPPED, CANCELLED)',
        priority: 'Enum (LOW, NORMAL, HIGH, URGENT)',
        courier: 'String',
        trackingNumber: 'String',
        notes: 'String',
        createdAt: 'DateTime',
        updatedAt: 'DateTime',
        pickedAt: 'DateTime',
        packedAt: 'DateTime',
        shippedAt: 'DateTime',
      },
    },
    OrderItem: {
      fields: {
        id: 'String UUID',
        orderId: 'String UUID FK',
        productId: 'String UUID FK',
        quantity: 'Int',
        quantityPicked: 'Int',
        quantityPacked: 'Int',
        binId: 'String UUID FK',
        pickedBy: 'String UUID FK',
        packedBy: 'String UUID FK',
        pickedAt: 'DateTime',
        packedAt: 'DateTime',
      },
    },
    
    // Purchase Orders (Pro/Elite only)
    PurchaseOrder: {
      fields: {
        id: 'String UUID',
        siteId: 'String UUID FK',
        orderNumber: 'String unique',
        supplierName: 'String',
        supplierEmail: 'String',
        status: 'Enum (DRAFT, ORDERED, RECEIVED, CANCELLED)',
        orderDate: 'DateTime',
        expectedDate: 'DateTime',
        receivedDate: 'DateTime',
        notes: 'String',
        createdAt: 'DateTime',
        updatedAt: 'DateTime',
      },
    },
    PurchaseOrderItem: {
      fields: {
        id: 'String UUID',
        purchaseOrderId: 'String UUID FK',
        productId: 'String UUID FK',
        quantity: 'Int',
        quantityReceived: 'Int',
        unitCost: 'Decimal',
        binId: 'String UUID FK',
      },
    },
    
    // Returns (Pro/Elite only)
    ReturnOrder: {
      fields: {
        id: 'String UUID',
        siteId: 'String UUID FK',
        orderNumber: 'String',
        returnNumber: 'String unique',
        customerName: 'String',
        customerEmail: 'String',
        reason: 'Enum (DAMAGED, WRONG_ITEM, NOT_NEEDED, OTHER)',
        status: 'Enum (PENDING, APPROVED, RECEIVED, REFUNDED, REJECTED)',
        notes: 'String',
        createdAt: 'DateTime',
        updatedAt: 'DateTime',
      },
    },
    ReturnItem: {
      fields: {
        id: 'String UUID',
        returnOrderId: 'String UUID FK',
        productId: 'String UUID FK',
        quantity: 'Int',
        quantityReceived: 'Int',
        condition: 'Enum (NEW, OPEN_BOX, DAMAGED, USED)',
        binId: 'String UUID FK',
      },
    },
    
    // Stock Takes (Pro/Elite only)
    StockTake: {
      fields: {
        id: 'String UUID',
        siteId: 'String UUID FK',
        stockTakeNumber: 'String unique',
        status: 'Enum (DRAFT, IN_PROGRESS, COMPLETED, CANCELLED)',
        type: 'Enum (FULL, PARTIAL, CYCLE)',
        scheduledDate: 'DateTime',
        completedAt: 'DateTime',
        notes: 'String',
        createdAt: 'DateTime',
        updatedAt: 'DateTime',
      },
    },
    StockTakeItem: {
      fields: {
        id: 'String UUID',
        stockTakeId: 'String UUID FK',
        productId: 'String UUID FK',
        binId: 'String UUID FK',
        systemQuantity: 'Int',
        countedQuantity: 'Int',
        variance: 'Int',
        reason: 'String',
      },
    },
    
    // Audit Logs
    AuditLog: {
      fields: {
        id: 'String UUID',
        userId: 'String UUID FK',
        siteId: 'String UUID FK',
        action: 'Enum (CREATE, UPDATE, DELETE, LOGIN, LOGOUT)',
        entityType: 'String',
        entityId: 'String',
        oldValues: 'String JSON',
        newValues: 'String JSON',
        ipAddress: 'String',
        userAgent: 'String',
        createdAt: 'DateTime',
      },
    },
    InventoryChangeLog: {
      fields: {
        id: 'String UUID',
        productId: 'String UUID FK',
        binId: 'String UUID FK',
        userId: 'String UUID FK',
        orderId: 'String UUID FK',
        changeType: 'Enum (IN, OUT, ADJUSTMENT, TRANSFER)',
        quantityBefore: 'Int',
        quantityChange: 'Int',
        quantityAfter: 'Int',
        reason: 'String',
        reference: 'String',
        createdAt: 'DateTime',
      },
    },
  },
};

// API Contract
export const API_CONTRACTS = {
  // Auth Endpoints
  auth: {
    POST_login: {
      path: '/api/auth/login',
      body: { email: 'String', password: 'String' },
      response: {
        token: 'String JWT',
        user: { id: 'UUID', email: 'String', role: 'String', organizationId: 'UUID' }
      },
    },
    POST_register: {
      path: '/api/auth/register',
      body: { 
        email: 'String', 
        password: 'String', 
        firstName: 'String', 
        lastName: 'String',
        organizationName: 'String',
        plan: 'Enum (STARTER, PRO, ELITE)'
      },
      response: {
        token: 'String JWT',
        user: { id: 'UUID', email: 'String', role: 'String', organizationId: 'UUID' }
      },
    },
  },
  
  // Products Endpoints
  products: {
    GET_list: {
      path: '/api/products',
      queryParams: { siteId: 'UUID', page: 'Int', limit: 'Int' },
      response: { products: 'Array', total: 'Int', page: 'Int' },
    },
    POST_create: {
      path: '/api/products',
      body: {
        sku: 'String',
        name: 'String',
        description: 'String',
        category: 'String',
        unitCost: 'Decimal',
        retailPrice: 'Decimal',
        barcode: 'String',
        barcodeType: 'String',
      },
      response: 'Product object',
    },
    GET_detail: {
      path: '/api/products/:id',
      response: 'Product object with inventory',
    },
    PUT_update: {
      path: '/api/products/:id',
      body: 'Partial product object',
      response: 'Updated product object',
    },
    DELETE_delete: {
      path: '/api/products/:id',
      response: { success: 'Boolean' },
    },
  },
  
  // Orders Endpoints
  orders: {
    GET_list: {
      path: '/api/orders',
      queryParams: { siteId: 'UUID', status: 'Enum', page: 'Int', limit: 'Int' },
      response: { orders: 'Array', total: 'Int', page: 'Int' },
    },
    POST_create: {
      path: '/api/orders',
      body: {
        siteId: 'UUID',
        customerId: 'String',
        customerName: 'String',
        customerEmail: 'String',
        customerPhone: 'String',
        shippingAddress: 'Object',
        items: 'Array of OrderItem',
      },
      response: 'Order object',
    },
    GET_detail: {
      path: '/api/orders/:id',
      response: 'Order object with items',
    },
    PUT_updateStatus: {
      path: '/api/orders/:id/status',
      body: { status: 'Enum' },
      response: 'Updated order object',
    },
    POST_pickItem: {
      path: '/api/orders/:orderId/pick',
      body: { productId: 'UUID', quantity: 'Int', binId: 'UUID' },
      response: 'Updated order item',
    },
  },
  
  // Common Response Format
  errorResponse: {
    error: 'String code (e.g., INV_002_INSUFFICIENT_STOCK)',
    message: 'String description',
    statusCode: 'Int HTTP status',
    category: 'String (AUTH, PLAN, INV, ORD, PICK, USER, SITE, VAL, DB, SYS)',
    details: 'Object optional',
  },
  successResponse: {
    data: 'Object or Array',
    message: 'String optional',
  },
};

// Plan Limits (ENFORCED SERVER-SIDE)
export const PLAN_LIMITS = {
  STARTER: {
    maxUsers: 15,
    maxSites: 2,
    features: [
      'inventory', 'orders', 'picking', 'packing', 'shipping', 'products', 'bins'
    ],
  },
  PRO: {
    maxUsers: 30,
    maxSites: 4,
    features: [
      'inventory', 'orders', 'picking', 'packing', 'shipping', 'products', 'bins',
      'purchaseOrders', 'returns', 'stockTakes', 'batchPicking', 'barcodeGeneration'
    ],
  },
  ELITE: {
    maxUsers: 50,
    maxSites: -1, // Unlimited
    features: [
      'inventory', 'orders', 'picking', 'packing', 'shipping', 'products', 'bins',
      'purchaseOrders', 'returns', 'stockTakes', 'batchPicking', 'barcodeGeneration',
      'wavePlanning', 'reports', 'analytics'
    ],
  },
};

// Roles & Permissions
export const ROLE_PERMISSIONS = {
  ADMIN: [
    'users:read', 'users:write', 'users:delete',
    'sites:read', 'sites:write', 'sites:delete',
    'products:read', 'products:write', 'products:delete',
    'orders:read', 'orders:write', 'orders:delete',
    'inventory:read', 'inventory:write', 'inventory:delete',
    'reports:read',
    'settings:read', 'settings:write',
  ],
  MANAGER: [
    'users:read', 'users:write',
    'sites:read',
    'products:read', 'products:write',
    'orders:read', 'orders:write',
    'inventory:read', 'inventory:write',
    'reports:read',
  ],
  OPERATOR: [
    'orders:read', 'orders:write',
    'inventory:read', 'inventory:write',
    'products:read',
  ],
  VIEWER: [
    'orders:read',
    'inventory:read',
    'products:read',
  ],
};

/**
 * Get database schema for a model
 */
export function getModelSchema(modelName) {
  return DB_SCHEMA.models[modelName];
}

/**
 * Check if field exists in model
 */
export function fieldExists(modelName, fieldName) {
  const model = getModelSchema(modelName);
  return model && model.fields.hasOwnProperty(fieldName);
}

/**
 * Get API contract for endpoint
 */
export function getAPIContract(endpoint, method) {
  const [resource] = endpoint.split('/').filter(Boolean);
  const resourceContracts = API_CONTRACTS[resource];
  
  if (!resourceContracts) {
    return null;
  }
  
  const key = `${method}_${endpoint.split('/').slice(1).join('_') || 'list'}`;
  return resourceContracts[key];
}

/**
 * Check if feature is available in plan
 */
export function isFeatureInPlan(plan, feature) {
  const planLimits = PLAN_LIMITS[plan];
  return planLimits && planLimits.features.includes(feature);
}

/**
 * Check if role has permission
 */
export function hasPermission(role, permission) {
  const permissions = ROLE_PERMISSIONS[role];
  return permissions && permissions.includes(permission);
}

/**
 * Validate model object against schema
 */
export function validateAgainstSchema(modelName, data) {
  const model = getModelSchema(modelName);
  
  if (!model) {
    throw new Error(`Unknown model: ${modelName}`);
  }
  
  const errors = [];
  
  for (const [field, type] of Object.entries(model.fields)) {
    if (data[field] !== undefined && data[field] !== null) {
      // Basic type checking
      const typeStr = type.toLowerCase();
      
      if (typeStr.includes('int') && typeof data[field] !== 'number') {
        errors.push({ field, expected: 'number', got: typeof data[field] });
      }
      
      if (typeStr.includes('string') && typeof data[field] !== 'string') {
        errors.push({ field, expected: 'string', got: typeof data[field] });
      }
      
      if (typeStr.includes('boolean') && typeof data[field] !== 'boolean') {
        errors.push({ field, expected: 'boolean', got: typeof data[field] });
      }
      
      if (typeStr.includes('json') && typeof data[field] !== 'object') {
        errors.push({ field, expected: 'object', got: typeof data[field] });
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
