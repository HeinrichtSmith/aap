import express from 'express';
import {
  getAllStockTakes,
  getStockTakeById,
  createStockTake,
  updateStockTake,
  updateStockTakeItem,
  submitStockTake,
  approveStockTake,
  deleteStockTake,
} from '../controllers/stockTakesController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { createStockTakeValidation, updateStockTakeItemValidation } from '../utils/validators.js';
import { validateRequest } from '../middleware/errorHandler.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/stock-takes
 * @desc    Get all stock takes
 * @access  Private
 */
router.get('/', getAllStockTakes);

/**
 * @route   GET /api/stock-takes/:id
 * @desc    Get single stock take
 * @access  Private
 */
router.get('/:id', getStockTakeById);

/**
 * @route   POST /api/stock-takes
 * @desc    Create new stock take
 * @access  Private (ADMIN/MANAGER)
 */
router.post(
  '/',
  authorize('ADMIN', 'MANAGER'),
  createStockTakeValidation,
  validateRequest,
  createStockTake
);

/**
 * @route   PUT /api/stock-takes/:id
 * @desc    Update stock take
 * @access  Private (ADMIN/MANAGER)
 */
router.put(
  '/:id',
  authorize('ADMIN', 'MANAGER'),
  updateStockTake
);

/**
 * @route   POST /api/stock-takes/:id/items
 * @desc    Add or update stock take item
 * @access  Private (ADMIN/MANAGER)
 */
router.post(
  '/:id/items',
  authorize('ADMIN', 'MANAGER'),
  updateStockTakeItemValidation,
  validateRequest,
  updateStockTakeItem
);

/**
 * @route   POST /api/stock-takes/:id/submit
 * @desc    Submit stock take for approval
 * @access  Private (ADMIN/MANAGER)
 */
router.post(
  '/:id/submit',
  authorize('ADMIN', 'MANAGER'),
  submitStockTake
);

/**
 * @route   POST /api/stock-takes/:id/approve
 * @desc    Approve stock take and adjust inventory
 * @access  Private (ADMIN only)
 */
router.post('/:id/approve', authorize('ADMIN'), approveStockTake);

/**
 * @route   DELETE /api/stock-takes/:id
 * @desc    Delete stock take (only if not completed)
 * @access  Private (ADMIN only)
 */
router.delete('/:id', authorize('ADMIN'), deleteStockTake);

export default router;
