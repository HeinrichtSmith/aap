import express from 'express';
import {
  getBins,
  getBin,
  getBinByCode,
  createBin,
  updateBin,
  deleteBin,
  getBinsByLocation,
  getAvailableBins,
} from '../controllers/binsController.js';
import { authenticate, authorize, validateRequest } from '../middleware/auth.js';
import { createBinValidation, updateBinValidation } from '../utils/validators.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/bins/available
 * @desc    Get bins with available capacity
 * @access  Private (all authenticated users)
 */
router.get('/available', getAvailableBins);

/**
 * @route   GET /api/bins/location/:aisle/:row
 * @desc    Get bins by location (aisle/row)
 * @access  Private (all authenticated users)
 */
router.get('/location/:aisle/:row', getBinsByLocation);

/**
 * @route   GET /api/bins
 * @desc    Get all bins (filtered by company)
 * @access  Private (all authenticated users)
 */
router.get('/', getBins);

/**
 * @route   GET /api/bins/code/:code
 * @desc    Get bin by code
 * @access  Private (all authenticated users)
 */
router.get('/code/:code', getBinByCode);

/**
 * @route   GET /api/bins/:id
 * @desc    Get single bin
 * @access  Private (all authenticated users)
 */
router.get('/:id', getBin);

/**
 * @route   POST /api/bins
 * @desc    Create new bin
 * @access  Private (ADMIN/MANAGER)
 */
router.post(
  '/',
  authorize('ADMIN', 'MANAGER'),
  createBinValidation,
  validateRequest,
  createBin
);

/**
 * @route   PUT /api/bins/:id
 * @desc    Update bin
 * @access  Private (ADMIN/MANAGER)
 */
router.put(
  '/:id',
  authorize('ADMIN', 'MANAGER'),
  updateBinValidation,
  validateRequest,
  updateBin
);

/**
 * @route   DELETE /api/bins/:id
 * @desc    Delete bin (only if no inventory or products)
 * @access  Private (ADMIN only)
 */
router.delete('/:id', authorize('ADMIN'), deleteBin);

export default router;
