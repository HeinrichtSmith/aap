import express from 'express';
import {
  getAllPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder,
  updatePurchaseOrder,
  receivePurchaseOrder,
  deletePurchaseOrder,
} from '../controllers/purchaseOrdersController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { createPurchaseOrderValidation } from '../utils/validators.js';
import { validateRequest } from '../middleware/errorHandler.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/purchase-orders
 * @desc    Get all purchase orders
 * @access  Private
 */
router.get('/', getAllPurchaseOrders);

/**
 * @route   GET /api/purchase-orders/:id
 * @desc    Get single purchase order
 * @access  Private
 */
router.get('/:id', getPurchaseOrderById);

/**
 * @route   POST /api/purchase-orders
 * @desc    Create new purchase order
 * @access  Private (ADMIN/MANAGER/RECEIVER)
 */
router.post(
  '/',
  authorize('ADMIN', 'MANAGER', 'RECEIVER'),
  createPurchaseOrderValidation,
  validateRequest,
  createPurchaseOrder
);

/**
 * @route   PUT /api/purchase-orders/:id
 * @desc    Update purchase order
 * @access  Private (ADMIN/MANAGER/RECEIVER)
 */
router.put(
  '/:id',
  authorize('ADMIN', 'MANAGER', 'RECEIVER'),
  updatePurchaseOrder
);

/**
 * @route   POST /api/purchase-orders/:id/receive
 * @desc    Receive items from purchase order
 * @access  Private (ADMIN/MANAGER/RECEIVER)
 */
router.post(
  '/:id/receive',
  authorize('ADMIN', 'MANAGER', 'RECEIVER'),
  receivePurchaseOrder
);

/**
 * @route   DELETE /api/purchase-orders/:id
 * @desc    Delete purchase order (only if pending)
 * @access  Private (ADMIN only)
 */
router.delete('/:id', authorize('ADMIN'), deletePurchaseOrder);

export default router;
