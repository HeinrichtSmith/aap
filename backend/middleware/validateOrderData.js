/**
 * Validation middleware for order data
 * Ensures data integrity and format compliance
 */

/**
 * Validate OrderItem structure
 * @param {Object} item - OrderItem to validate
 * @returns {Object} - { valid: boolean, errors: string[] }
 */
function validateOrderItem(item) {
  const errors = [];

  // SKU validation - must be 12-13 digit numeric string
  if (!item.sku || typeof item.sku !== 'string') {
    errors.push('SKU is required and must be a string');
  } else if (!/^\d{12,13}$/.test(item.sku)) {
    errors.push('SKU must be 12-13 digit numeric string');
  }

  // Barcode validation - if provided, must be 12-13 digit numeric string
  if (item.barcode && typeof item.barcode === 'string') {
    if (!/^\d{12,13}$/.test(item.barcode)) {
      errors.push('Barcode must be 12-13 digit numeric string');
    }
  }

  // Name validation - must be non-empty string
  if (!item.name || typeof item.name !== 'string' || item.name.trim().length === 0) {
    errors.push('Item name is required and must be non-empty');
  }

  // Quantity validation - must be positive integer
  if (!item.quantity || typeof item.quantity !== 'number' || item.quantity <= 0) {
    errors.push('Quantity must be a positive integer');
  }

  // Location validation - must be non-null string
  if (!item.location || typeof item.location !== 'string' || item.location.trim().length === 0) {
    errors.push('Location is required and must be a non-empty string');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate complete Order object
 * @param {Object} orderData - Order to validate
 * @returns {Object} - { valid: boolean, errors: string[] }
 */
function validateOrder(orderData) {
  const errors = [];

  // Customer information
  if (!orderData.customerName || typeof orderData.customerName !== 'string' || orderData.customerName.trim().length === 0) {
    errors.push('Customer name is required');
  }

  if (!orderData.customerEmail || typeof orderData.customerEmail !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(orderData.customerEmail)) {
    errors.push('Valid customer email is required');
  }

  if (!orderData.customerPhone || typeof orderData.customerPhone !== 'string' || orderData.customerPhone.trim().length === 0) {
    errors.push('Customer phone is required');
  }

  // Status validation
  const validStatuses = ['PENDING', 'PICKING', 'READY_TO_PACK', 'PACKED', 'SHIPPED', 'CANCELLED'];
  if (!orderData.status || !validStatuses.includes(orderData.status)) {
    errors.push(`Status must be one of: ${validStatuses.join(', ')}`);
  }

  // Priority validation
  const validPriorities = ['LOW', 'NORMAL', 'OVERNIGHT', 'URGENT'];
  if (orderData.priority && !validPriorities.includes(orderData.priority)) {
    errors.push(`Priority must be one of: ${validPriorities.join(', ')}`);
  }

  // Estimated time validation - must be positive integer or default to 10
  if (orderData.estimatedPickMinutes !== undefined && (typeof orderData.estimatedPickMinutes !== 'number' || orderData.estimatedPickMinutes < 0)) {
    errors.push('Estimated pick minutes must be a non-negative number');
  }

  // Items validation - must have at least one item
  if (!orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
    errors.push('Order must contain at least one item');
  } else {
    // Validate each item
    orderData.items.forEach((item, index) => {
      const itemValidation = validateOrderItem(item);
      if (!itemValidation.valid) {
        errors.push(`Item ${index + 1}: ${itemValidation.errors.join(', ')}`);
      }
    });
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Express middleware to validate order creation/update requests
 */
function validateOrderMiddleware(req, res, next) {
  const { body } = req;

  const validation = validateOrder(body);

  if (!validation.valid) {
    return res.status(400).json({
      success: false,
      error: 'ValidationError',
      message: 'Order data validation failed',
      details: validation.errors
    });
  }

  // Add default values if missing
  req.body.estimatedPickMinutes = body.estimatedPickMinutes || 10;

  // Ensure all items have proper defaults
  if (req.body.items) {
    req.body.items = req.body.items.map(item => ({
      ...item,
      pickedQuantity: item.pickedQuantity || 0,
      packedQuantity: item.packedQuantity || 0,
      location: item.location || 'UNKNOWN',
      name: item.name || 'Unknown Item'
    }));
  }

  next();
}

module.exports = {
  validateOrder,
  validateOrderItem,
  validateOrderMiddleware
};