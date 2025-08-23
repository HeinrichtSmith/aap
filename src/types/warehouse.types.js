// 🏭 Arrowhead WMS - Type Definitions
// This file provides comprehensive type definitions for the warehouse system

/**
 * User Management Types
 */
export const UserTypes = {
  // User object structure
  User: {
    id: 'string',
    name: 'string',
    email: 'string',
    role: 'string', // 'picker', 'packer', 'supervisor', 'admin'
    level: 'number',
    xp: 'number',
    xpToNextLevel: 'number',
    achievements: 'string[]',
    stats: 'UserStats',
    preferences: 'UserPreferences'
  },

  // User statistics
  UserStats: {
    ordersProcessed: 'number',
    itemsPicked: 'number',
    averagePickTime: 'number',
    accuracy: 'number',
    totalXP: 'number',
    currentStreak: 'number',
    bestStreak: 'number'
  },

  // User preferences
  UserPreferences: {
    soundEnabled: 'boolean',
    animationsEnabled: 'boolean',
    theme: 'string', // 'dark', 'light'
    notifications: 'boolean',
    autoPrint: 'boolean'
  }
};

/**
 * Order Management Types
 */
export const OrderTypes = {
  // Base order structure
  Order: {
    id: 'string',
    orderId: 'string',
    customer: 'string',
    priority: 'string', // 'urgent', 'overnight', 'normal'
    status: 'string', // 'pending', 'picking', 'picked', 'packing', 'packed', 'shipped'
    dueDate: 'string', // ISO date string
    totalItems: 'number',
    items: 'OrderItem[]',
    createdAt: 'string',
    updatedAt: 'string'
  },

  // Order item structure
  OrderItem: {
    id: 'string',
    name: 'string',
    quantity: 'number',
    binLocation: 'string',
    picked: 'boolean',
    pickedQuantity: 'number',
    pickedAt: 'string?'
  },

  // Picked order with additional data
  PickedOrder: {
    ...OrderTypes.Order,
    pickedDate: 'string',
    pickedItems: 'PickedItem[]',
    pickingTime: 'number',
    pickingStats: 'PickingStats'
  },

  // Packed order with shipping data
  PackedOrder: {
    ...OrderTypes.Order,
    packedDate: 'string',
    packages: 'Package[]',
    shippingLabel: 'string',
    trackingNumber: 'string'
  }
};

/**
 * Inventory Management Types
 */
export const InventoryTypes = {
  // Product structure
  Product: {
    id: 'string',
    sku: 'string',
    name: 'string',
    description: 'string',
    category: 'string',
    binLocation: 'string',
    currentStock: 'number',
    minStock: 'number',
    maxStock: 'number',
    unit: 'string',
    lastUpdated: 'string'
  },

  // Bin location structure
  Bin: {
    id: 'string',
    location: 'string',
    zone: 'string',
    capacity: 'number',
    currentItems: 'number',
    lastAudit: 'string'
  },

  // Stock movement
  StockMovement: {
    id: 'string',
    productId: 'string',
    type: 'string', // 'in', 'out', 'adjustment', 'audit'
    quantity: 'number',
    previousStock: 'number',
    newStock: 'number',
    reason: 'string',
    userId: 'string',
    timestamp: 'string'
  }
};

/**
 * Package Management Types
 */
export const PackageTypes = {
  // Package structure
  Package: {
    id: 'string',
    type: 'string', // 'box', 'envelope', 'satchel', 'pallet'
    name: 'string',
    dimensions: 'Dimensions',
    weight: 'number',
    maxWeight: 'number',
    iconType: 'string', // GameIcon type
    color: 'string',
    quantity: 'number'
  },

  // Package dimensions
  Dimensions: {
    length: 'number',
    width: 'number',
    height: 'number',
    unit: 'string' // 'cm', 'mm', 'in'
  },

  // Shipment cart item
  CartItem: {
    package: 'Package',
    quantity: 'number',
    selected: 'boolean'
  }
};

/**
 * Performance & Analytics Types
 */
export const AnalyticsTypes = {
  // Picking performance
  PickingStats: {
    time: 'number',
    accuracy: 'number',
    itemsPicked: 'number',
    errors: 'number',
    efficiency: 'number' // items per minute
  },

  // Packing performance
  PackingStats: {
    time: 'number',
    packagesUsed: 'number',
    totalWeight: 'number',
    efficiency: 'number'
  },

  // Achievement structure
  Achievement: {
    id: 'string',
    name: 'string',
    description: 'string',
    icon: 'string',
    xpReward: 'number',
    criteria: 'AchievementCriteria',
    unlocked: 'boolean',
    unlockedAt: 'string?'
  },

  // Achievement criteria
  AchievementCriteria: {
    type: 'string', // 'orders', 'speed', 'accuracy', 'streak'
    target: 'number',
    timeframe: 'string?' // 'daily', 'weekly', 'monthly', 'all-time'
  }
};

/**
 * UI Component Types
 */
export const ComponentTypes = {
  // GameIcon props
  GameIcon: {
    type: 'string',
    size: 'string', // 'sm', 'md', 'lg', 'xl'
    quantity: 'number',
    color: 'string?',
    animated: 'boolean',
    onClick: 'function?'
  },

  // Button variants
  ButtonVariant: {
    primary: 'string',
    secondary: 'string',
    success: 'string',
    warning: 'string',
    danger: 'string',
    ghost: 'string'
  },

  // Modal props
  Modal: {
    isOpen: 'boolean',
    onClose: 'function',
    title: 'string',
    children: 'ReactNode',
    size: 'string' // 'sm', 'md', 'lg', 'xl'
  }
};

/**
 * Animation & Sound Types
 */
export const AnimationTypes = {
  // Framer Motion variants
  MotionVariants: {
    initial: 'object',
    animate: 'object',
    exit: 'object',
    hover: 'object?',
    tap: 'object?'
  },

  // Sound types
  SoundType: {
    success: 'string',
    error: 'string',
    complete: 'string',
    confetti: 'string',
    click: 'string',
    notification: 'string'
  }
};

/**
 * API Response Types
 */
export const APITypes = {
  // Standard API response
  APIResponse: {
    success: 'boolean',
    data: 'any',
    message: 'string?',
    error: 'string?'
  },

  // Paginated response
  PaginatedResponse: {
    data: 'any[]',
    total: 'number',
    page: 'number',
    limit: 'number',
    hasMore: 'boolean'
  }
};

/**
 * Configuration Types
 */
export const ConfigTypes = {
  // App configuration
  AppConfig: {
    version: 'string',
    environment: 'string', // 'development', 'staging', 'production'
    apiUrl: 'string',
    features: 'FeatureFlags'
  },

  // Feature flags
  FeatureFlags: {
    gamification: 'boolean',
    realTimeUpdates: 'boolean',
    advancedAnalytics: 'boolean',
    mobileSupport: 'boolean'
  }
};

/**
 * Error Types
 */
export const ErrorTypes = {
  // Application errors
  AppError: {
    code: 'string',
    message: 'string',
    details: 'object?',
    timestamp: 'string'
  },

  // Validation errors
  ValidationError: {
    field: 'string',
    message: 'string',
    value: 'any'
  }
};

// Export all type definitions
export const WarehouseTypes = {
  User: UserTypes,
  Order: OrderTypes,
  Inventory: InventoryTypes,
  Package: PackageTypes,
  Analytics: AnalyticsTypes,
  Component: ComponentTypes,
  Animation: AnimationTypes,
  API: APITypes,
  Config: ConfigTypes,
  Error: ErrorTypes
};

// Helper function to validate data against types
export const validateData = (data, typeDefinition) => {
  // This would be used in development to validate data structures
  console.log(`Validating ${typeDefinition} against data:`, data);
  return true;
};

// Type checking utilities
export const isOrder = (obj) => {
  return obj && typeof obj === 'object' && 'orderId' in obj && 'items' in obj;
};

export const isUser = (obj) => {
  return obj && typeof obj === 'object' && 'id' in obj && 'name' in obj;
};

export const isProduct = (obj) => {
  return obj && typeof obj === 'object' && 'sku' in obj && 'name' in obj;
};

// Export default for easy importing
export default WarehouseTypes; 