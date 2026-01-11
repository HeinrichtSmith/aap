import express from 'express';
import {
  getAllReturns,
  getReturnById,
  createReturn,
  updateReturn,
  processReturn,
  deleteReturn,
} from '../controllers/returnsController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { createReturnValidation } from '../utils/validators.js';
import { validateRequest } from '../middleware/errorHandler.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/returns
 * @desc    Get all returns
 * @access  Private
 */
router.get('/', getAllReturns);

/**
 * @route   GET /api/returns/:id
 * @desc    Get single return
 * @access  Private
 */
router.get('/:id', getReturnById);

/**
 * @route   POST /api/returns
 * @desc    Create new return
 * @access  Private (ADMIN/MANAGER/PACKER)
 */
router.post(
  '/',
  authorize('ADMIN', 'MANAGER', 'PACKER'),
  createReturnValidation,
  validateRequest,
  createReturn
);

/**
 * @route   PUT /api/returns/:id
 * @desc    Update return
 * @access  Private (ADMIN/MANAGER)
 */
router.put(
  '/:id',
  authorize('ADMIN', 'MANAGER'),
  updateReturn
);

/**
 * @route   POST /api/returns/:id/process
 * @desc    Process return (restock/refund)
 * @access  Private (ADMIN/MANAGER)
 */
router.post(
  '/:id/process',
  authorize('ADMIN', 'MANAGER'),
  processReturn
);

/**
 * @route   DELETE /api/returns/:id
 * @desc    Delete return (only if pending)
 * @access  Private (ADMIN only)
 */
router.delete('/:id', authorize('ADMIN'), deleteReturn);

export default router;
