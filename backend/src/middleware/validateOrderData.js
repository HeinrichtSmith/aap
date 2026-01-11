import { body, validationResult } from 'express-validator';

/**
 * Validate order creation data
 * Ensures required fields are present and properly formatted
 */
export const validateOrderMiddleware = [
  // Validate customer information
  body('customerName')
    .notEmpty()
    .withMessage('customerName is required')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('customerName must be between 2 and 100 characters'),

  body('customerEmail')
    .notEmpty()
    .withMessage('customerEmail is required')
    .trim()
    .isEmail()
    .withMessage('customerEmail must be a valid email address'),

  body('customerPhone')
    .optional()
    .trim()
    .matches(/^\+?[\d\s-()]+$/)
    .withMessage('customerPhone must be a valid phone number'),

  // Validate items
  body('items')
    .notEmpty()
    .withMessage('items array is required')
    .isArray({ min: 1 })
    .withMessage('items must contain at least one item'),

  body('items.*.sku')
    .notEmpty()
    .withMessage('item sku is required')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('item sku must be between 1 and 50 characters'),

  body('items.*.name')
    .notEmpty()
    .withMessage('item name is required')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('item name must be between 1 and 200 characters'),

  body('items.*.barcode')
    .optional()
    .trim()
    .isLength({ min: 8, max: 13 })
    .withMessage('barcode must be between 8 and 13 characters'),

  body('items.*.quantity')
    .notEmpty()
    .withMessage('item quantity is required')
    .isInt({ min: 1 })
    .withMessage('item quantity must be a positive integer'),

  body('items.*.location')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('item location must be between 1 and 50 characters'),

  // Validate shipping address
  body('shippingAddress')
    .optional()
    .isObject()
    .withMessage('shippingAddress must be an object'),

  body('shippingAddress.street')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('street must be between 1 and 200 characters'),

  body('shippingAddress.city')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('city must be between 1 and 100 characters'),

  body('shippingAddress.postalCode')
    .optional()
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage('postalCode must be between 1 and 20 characters'),

  body('shippingAddress.country')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('country must be between 1 and 100 characters'),

  // Validate priority
  body('priority')
    .optional()
    .trim()
    .isIn(['LOW', 'NORMAL', 'HIGH', 'URGENT'])
    .withMessage('priority must be one of: LOW, NORMAL, HIGH, URGENT'),

  // Validate notes
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('notes must be less than 500 characters'),

  // Validate siteId
  body('siteId')
    .optional()
    .trim()
    .isString()
    .withMessage('siteId must be a string'),

  // Check validation results
  (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'ValidationError',
        message: 'Invalid order data',
        details: errors.array().map(err => ({
          field: err.path,
          message: err.msg,
          value: err.value,
        })),
      });
    }

    // Normalize and validate data
    const normalizedData = {};

    // Normalize priority to uppercase
    if (req.body.priority) {
      normalizedData.priority = req.body.priority.toUpperCase();
    }

    // Estimate pick minutes (simple calculation: 1 min per 2 items, minimum 5)
    const items = req.body.items || [];
    normalizedData.estimatedPickMinutes = Math.max(5, Math.ceil(items.length / 2));

    // Normalize items
    if (items.length > 0) {
      normalizedData.items = items.map(item => ({
        ...item,
        sku: item.sku.trim().toUpperCase(),
        name: item.name.trim(),
        barcode: item.barcode ? item.barcode.trim() : null,
        quantity: parseInt(item.quantity, 10),
        location: item.location ? item.location.trim().toUpperCase() : null,
      }));
    }

    // Merge normalized data with request body
    req.body = {
      ...req.body,
      ...normalizedData,
    };

    next();
  },
];

/**
 * Validate order status update
 */
export const validateOrderStatusUpdate = [
  body('status')
    .notEmpty()
    .withMessage('status is required')
    .trim()
    .isIn(['PENDING', 'PICKING', 'READY_TO_PACK', 'PACKED', 'SHIPPED', 'CANCELLED'])
    .withMessage('status must be one of: PENDING, PICKING, READY_TO_PACK, PACKED, SHIPPED, CANCELLED'),

  (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'ValidationError',
        message: 'Invalid status',
        details: errors.array(),
      });
    }

    req.body.status = req.body.status.toUpperCase();
    next();
  },
];