/**
 * Order Normalizer Utility
 * Provides defensive data transformation and validation for orders
 * Ensures frontend receives consistent, safe data regardless of backend inconsistencies
 */

/**
 * Safely format a date string for display
 * @param {string|Date|null|undefined} dateStr - Date to format
 * @returns {string} Formatted date string or fallback
 */
export const formatDate = (dateStr) => {
  if (!dateStr) return 'Not specified';
  try {
    const date = dateStr instanceof Date ? dateStr : new Date(dateStr);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleDateString('en-NZ', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch (e) {
    console.warn('Date formatting error:', e, 'Input:', dateStr);
    return 'Invalid Date';
  }
};

/**
 * Safely format estimated pick time
 * @param {number|null|undefined} minutes - Estimated pick minutes
 * @returns {string} Formatted time string (e.g., "0:30") or fallback
 */
export const formatEstimatedTime = (minutes) => {
  if (!minutes || minutes === null || minutes === undefined) return 'Not estimated';
  if (typeof minutes !== 'number' || isNaN(minutes)) return 'Invalid estimate';
  
  try {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}:${mins.toString().padStart(2, '0')}`;
  } catch (e) {
    console.warn('Estimated time formatting error:', e, 'Input:', minutes);
    return 'Invalid estimate';
  }
};

/**
 * Get bin location from order item with defensive fallback
 * @param {Object} item - Order item object
 * @returns {string} Bin location or 'Unknown'
 */
export const getBinLocation = (item) => {
  if (!item) return 'Unknown';
  
  // Try multiple field names for compatibility
  const location = item.binLocation || item.location;
  
  if (!location || typeof location !== 'string') {
    console.warn('Missing bin location for item:', item);
    return 'Unknown';
  }
  
  return location;
};

/**
 * Normalize a complete order object
 * Ensures all required fields are present and safely handles missing optional fields
 * @param {Object} apiOrder - Raw order from API
 * @returns {Object} Normalized order object
 */
export const normalizeOrder = (apiOrder) => {
  if (!apiOrder) {
    console.error('normalizeOrder: received null/undefined order');
    return null;
  }

  try {
    return {
      // Required fields - validate presence
      id: apiOrder.id,
      customerName: apiOrder.customerName || 'Unknown Customer',
      customerEmail: apiOrder.customerEmail,
      customerPhone: apiOrder.customerPhone,
      status: apiOrder.status || 'PENDING',
      priority: apiOrder.priority || 'NORMAL',
      siteId: apiOrder.siteId,
      
      // Required items array with normalization
      items: (apiOrder.items || []).map(item => normalizeOrderItem(item)),
      
      // Optional fields - provide defaults
      createdAt: apiOrder.createdAt,
      dueDate: apiOrder.dueDate || null,
      estimatedPickMinutes: apiOrder.estimatedPickMinutes || null,
      requiredBy: apiOrder.requiredBy || null,
      assignedPickerId: apiOrder.assignedPickerId || null,
      assignedPackerId: apiOrder.assignedPackerId || null,
      shippingAddress: apiOrder.shippingAddress,
      packageType: apiOrder.packageType || null,
      trackingNumber: apiOrder.trackingNumber || null,
      packedAt: apiOrder.packedAt,
      shippedAt: apiOrder.shippedAt,
      notes: apiOrder.notes,
      
      // Computed/calculated fields
      totalItems: (apiOrder.items || []).reduce((sum, item) => sum + (item.quantity || 0), 0),
    };
  } catch (e) {
    console.error('Error normalizing order:', e, 'Order:', apiOrder);
    throw new Error(`Failed to normalize order: ${e.message}`);
  }
};

/**
 * Normalize a single order item
 * @param {Object} item - Raw order item from API
 * @returns {Object} Normalized order item
 */
export const normalizeOrderItem = (item) => {
  if (!item) {
    console.error('normalizeOrderItem: received null/undefined item');
    return null;
  }

  try {
    return {
      id: item.id,
      orderId: item.orderId,
      productId: item.productId,
      sku: item.sku || 'Unknown SKU',
      name: item.name || 'Unknown Item',
      barcode: item.barcode || item.sku, // Fallback to SKU if barcode missing
      quantity: item.quantity || 0,
      pickedQuantity: item.pickedQuantity || 0,
      packedQuantity: item.packedQuantity || 0,
      
      // Handle both field name variations
      location: item.location || item.binLocation || 'Unknown',
      binLocation: item.binLocation || item.location || 'Unknown',
    };
  } catch (e) {
    console.error('Error normalizing order item:', e, 'Item:', item);
    throw new Error(`Failed to normalize order item: ${e.message}`);
  }
};

/**
 * Validate an order meets minimum requirements
 * @param {Object} order - Order to validate
 * @returns {boolean} True if valid
 */
export const isValidOrder = (order) => {
  if (!order) return false;
  if (!order.id) {
    console.warn('Invalid order: missing id');
    return false;
  }
  if (!order.status) {
    console.warn('Invalid order: missing status', order.id);
    return false;
  }
  if (!Array.isArray(order.items) || order.items.length === 0) {
    console.warn('Invalid order: items must be non-empty array', order.id);
    return false;
  }
  return true;
};

/**
 * Validate an order item meets minimum requirements
 * @param {Object} item - Order item to validate
 * @returns {boolean} True if valid
 */
export const isValidOrderItem = (item) => {
  if (!item) return false;
  if (!item.id) {
    console.warn('Invalid order item: missing id');
    return false;
  }
  if (!item.sku) {
    console.warn('Invalid order item: missing sku', item.id);
    return false;
  }
  if (!item.quantity || item.quantity <= 0) {
    console.warn('Invalid order item: invalid quantity', item.id, item.quantity);
    return false;
  }
  if (!item.location && !item.binLocation) {
    console.warn('Invalid order item: missing location fields', item.id);
    return false;
  }
  return true;
};

/**
 * Batch normalize multiple orders
 * @param {Array} orders - Array of orders to normalize
 * @returns {Array} Array of normalized orders
 */
export const normalizeOrders = (orders) => {
  if (!Array.isArray(orders)) {
    console.error('normalizeOrders: expected array, got', typeof orders);
    return [];
  }
  
  return orders
    .map(order => normalizeOrder(order))
    .filter(order => order !== null && isValidOrder(order));
};