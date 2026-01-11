import express from 'express';
import { 
  getAllSites, 
  getSiteById, 
  createSite, 
  updateSite, 
  deleteSite 
} from '../controllers/sitesController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { enforceSiteLimit } from '../middleware/planEnforcement.js';
import { createSiteValidation, updateSiteValidation } from '../utils/validators.js';
import { validateRequest } from '../middleware/errorHandler.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/sites
 * @desc    Get all sites for user's company
 * @access  Private (All authenticated users)
 */
router.get('/', getAllSites);

/**
 * @route   GET /api/sites/:id
 * @desc    Get single site by ID
 * @access  Private (All authenticated users)
 */
router.get('/:id', getSiteById);

/**
 * @route   POST /api/sites
 * @desc    Create new site
 * @access  Private (ADMIN/MANAGER)
 */
router.post(
  '/', 
  authorize('ADMIN', 'MANAGER'),
  enforceSiteLimit,
  createSiteValidation,
  validateRequest,
  createSite
);

/**
 * @route   PUT /api/sites/:id
 * @desc    Update site
 * @access  Private (ADMIN/MANAGER)
 */
router.put(
  '/:id',
  authorize('ADMIN', 'MANAGER'),
  updateSiteValidation,
  validateRequest,
  updateSite
);

/**
 * @route   DELETE /api/sites/:id
 * @desc    Delete site
 * @access  Private (ADMIN/MANAGER)
 */
router.delete(
  '/:id',
  authorize('ADMIN', 'MANAGER'),
  deleteSite
);

export default router;
