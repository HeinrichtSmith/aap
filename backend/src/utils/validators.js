import { body, param, query, validationResult } from 'express-validator';

/**
 * Generic validation middleware
 * Takes validation rules and returns middleware that validates request
 */
export const validateRequest = (validationRules = {}) => {
  return (req, res, next) => {
    const errors = [];
    
    // Run all validations
    const promises = [];
    
    if (validationRules.body) {
      promises.push(Promise.all(validationRules.body.map(validation => validation.run(req))));
    }
    if (validationRules.params) {
      promises.push(Promise.all(validationRules.params.map(validation => validation.run(req))));
    }
    if (validationRules.query) {
      promises.push(Promise.all(validationRules.query.map(validation => validation.run(req))));
    }
    
    Promise.all(promises).then(() => {
      const result = validationResult(req);
      if (!result.isEmpty()) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Request validation failed',
          details: result.array()
        });
      }
      next();
    }).catch(next);
  };
};

/**
 * Site Validators
 */
export const createSiteValidation = [
  body('code')
    .trim()
    .notEmpty().withMessage('Site code is required')
    .matches(/^[A-Z]{3}\d{2}$/).withMessage('Site code must be in format XXX00 (e.g., AUK01)'),
  body('name')
    .trim()
    .notEmpty().withMessage('Site name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Site name must be 2-100 characters'),
  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive must be a boolean'),
  body('address')
    .optional()
    .isObject().withMessage('Address must be an object'),
];

export const updateSiteValidation = [
  param('id')
    .notEmpty().withMessage('Site ID is required')
    .isUUID().withMessage('Invalid site ID'),
  body('code')
    .optional()
    .trim()
    .matches(/^[A-Z]{3}\d{2}$/).withMessage('Site code must be in format XXX00'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Site name must be 2-100 characters'),
  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive must be a boolean'),
];

/**
 * User Validators
 */
export const createUserValidation = [
  body('email')
    .trim()
    .isEmail().withMessage('Invalid email address')
    .notEmpty().withMessage('Email is required'),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain uppercase, lowercase, and number'),
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('role')
    .optional()
    .isIn(['ADMIN', 'MANAGER', 'PICKER', 'PACKER', 'RECEIVER', 'STAFF']).withMessage('Invalid role'),
  body('department')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Department must be at most 50 characters'),
  body('siteId')
    .optional()
    .isUUID().withMessage('Invalid site ID'),
];

export const updateUserValidation = [
  param('id')
    .notEmpty().withMessage('User ID is required')
    .isUUID().withMessage('Invalid user ID'),
  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Invalid email address'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('department')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Department must be at most 50 characters'),
  body('siteId')
    .optional()
    .isUUID().withMessage('Invalid site ID'),
];

export const updateRoleValidation = [
  param('id')
    .notEmpty().withMessage('User ID is required')
    .isUUID().withMessage('Invalid user ID'),
  body('role')
    .trim()
    .notEmpty().withMessage('Role is required')
    .isIn(['ADMIN', 'MANAGER', 'PICKER', 'PACKER', 'RECEIVER', 'STAFF']).withMessage('Invalid role'),
];

/**
 * Bin Validators
 */
export const createBinValidation = [
  body('code')
    .trim()
    .notEmpty().withMessage('Bin code is required')
    .matches(/^[A-Z]-\d{2}-\d{2}$/).withMessage('Bin code must be in format A-00-00 (e.g., A-01-02)'),
  body('aisle')
    .trim()
    .notEmpty().withMessage('Aisle is required')
    .isLength({ min: 1, max: 1 }).withMessage('Aisle must be a single letter'),
  body('row')
    .trim()
    .notEmpty().withMessage('Row is required')
    .matches(/^\d{2}$/).withMessage('Row must be 2 digits'),
  body('column')
    .trim()
    .notEmpty().withMessage('Column is required')
    .matches(/^\d{2}$/).withMessage('Column must be 2 digits'),
  body('level')
    .optional()
    .matches(/^\d{2}$/).withMessage('Level must be 2 digits if provided'),
  body('type')
    .optional()
    .isIn(['small', 'medium', 'large', 'overflow']).withMessage('Invalid bin type'),
  body('capacity')
    .optional()
    .isInt({ min: 1 }).withMessage('Capacity must be a positive integer'),
];

export const updateBinValidation = [
  param('id')
    .notEmpty().withMessage('Bin ID is required')
    .isUUID().withMessage('Invalid bin ID'),
  body('code')
    .optional()
    .trim()
    .matches(/^[A-Z]-\d{2}-\d{2}$/).withMessage('Bin code must be in format A-00-00'),
  body('type')
    .optional()
    .isIn(['small', 'medium', 'large', 'overflow']).withMessage('Invalid bin type'),
  body('capacity')
    .optional()
    .isInt({ min: 1 }).withMessage('Capacity must be a positive integer'),
];

/**
 * Purchase Order Validators
 */
export const createPurchaseOrderValidation = [
  body('id')
    .trim()
    .notEmpty().withMessage('Purchase order ID is required')
    .matches(/^PO\d+$/).withMessage('Purchase order ID must start with PO'),
  body('supplierName')
    .trim()
    .notEmpty().withMessage('Supplier name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Supplier name must be 2-100 characters'),
  body('supplierEmail')
    .optional()
    .trim()
    .isEmail().withMessage('Invalid supplier email'),
  body('supplierPhone')
    .optional()
    .trim()
    .matches(/^\+64 \d{3} \d{4}$/).withMessage('Invalid phone number (format: +64 XXX XXXX)'),
  body('items')
    .isArray({ min: 1 }).withMessage('At least one item is required'),
];

/**
 * Return Validators
 */
export const createReturnValidation = [
  body('orderId')
    .optional()
    .trim()
    .notEmpty().withMessage('Order ID is required'),
  body('customerName')
    .trim()
    .notEmpty().withMessage('Customer name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Customer name must be 2-100 characters'),
  body('customerEmail')
    .trim()
    .notEmpty().withMessage('Customer email is required')
    .isEmail().withMessage('Invalid email address'),
  body('customerPhone')
    .trim()
    .notEmpty().withMessage('Customer phone is required')
    .matches(/^\+64 \d{3} \d{4}$/).withMessage('Invalid phone number (format: +64 XXX XXXX)'),
  body('reason')
    .trim()
    .notEmpty().withMessage('Return reason is required')
    .isLength({ min: 5, max: 500 }).withMessage('Reason must be 5-500 characters'),
];

/**
 * Stock Take Validators
 */
export const createStockTakeValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Stock take name is required')
    .isLength({ min: 2, max: 200 }).withMessage('Name must be 2-200 characters'),
  body('scheduledFor')
    .optional()
    .isISO8601().withMessage('Invalid date format'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Notes must be at most 1000 characters'),
];

export const updateStockTakeItemValidation = [
  param('id')
    .notEmpty().withMessage('Stock take ID is required')
    .isUUID().withMessage('Invalid stock take ID'),
  param('itemId')
    .notEmpty().withMessage('Item ID is required')
    .isUUID().withMessage('Invalid item ID'),
  body('actualQty')
    .isInt({ min: 0 }).withMessage('Actual quantity must be a non-negative integer')
    .notEmpty().withMessage('Actual quantity is required'),
];
