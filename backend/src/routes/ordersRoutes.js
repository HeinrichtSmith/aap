import express from 'express';
import { body } from 'express-validator';
import {
  getOrders,
  getOrder,
  createOrder,
  updateOrderStatus,
  assignPicker,
  pickItem,
  assignPacker,
  packOrder,
  shipOrder,
  getOrderStats,
} from '../controllers/ordersController.js';
import { authenticate, authorize, validateRequest } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Validation
const createOrderValidation = [
  body('customerName').notEmpty().withMessage('Customer name required'),
  body('customerEmail').isEmail().withMessage('Valid customer email required'),
  body('customerPhone').notEmpty().withMessage('Customer phone required'),
  body('items').isArray().withMessage('Items must be an array'),
  body('shippingAddress').isObject().withMessage('Shipping address required'),
];

const pickItemValidation = [
  body('itemId').notEmpty().withMessage('Item ID required'),
  body('quantity').isInt({ min:1 }).withMessage('Quantity must be positive'),
];

const packOrderValidation = [
  body('packageType').notEmpty().withMessage('Package type required'),
  body('trackingNumber').notEmpty().withMessage('Tracking number required'),
];

// CRUD routes (all authenticated users)
router.get('/', getOrders);
router.get('/stats', authorize('ADMIN', 'MANAGER'), getOrderStats);
router.get('/:id', getOrder);

// Admin/Manager routes
router.post(
  '/',
  authorize('ADMIN', 'MANAGER'),
  createOrderValidation,
  validateRequest,
  createOrder
);
router.put(
  '/:id/status',
  authorize('ADMIN', 'MANAGER'),
  body('status').notEmpty(),
  updateOrderStatus
);
router.put(
  '/:id/assign-picker',
  authorize('ADMIN', 'MANAGER'),
  body('pickerId').notEmpty(),
  assignPicker
);
router.put(
  '/:id/assign-packer',
  authorize('ADMIN', 'MANAGER'),
  body('packerId').notEmpty(),
  assignPacker
);

// Picker routes (also allows ADMIN/MANAGER)
router.put(
  '/:id/pick',
  authorize('PICKER', 'ADMIN', 'MANAGER'),
  pickItemValidation,
  validateRequest,
  pickItem
);

// Packer routes (also allows ADMIN/MANAGER)
router.put(
  '/:id/pack',
  authorize('PACKER', 'ADMIN', 'MANAGER'),
  packOrderValidation,
  validateRequest,
  packOrder
);

// Shipping (Admin/Manager)
router.put(
  '/:id/ship',
  authorize('ADMIN', 'MANAGER'),
  shipOrder
);

export default router;
