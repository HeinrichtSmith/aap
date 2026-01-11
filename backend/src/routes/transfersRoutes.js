/**
 * INVENTORY TRANSFERS ROUTES
 * 
 * Routes for cross-site inventory transfer operations.
 * Multi-location inventory management.
 */

import express from 'express';
import {
  createTransfer,
  getTransfers,
  getTransfer,
  approveTransfer,
  shipTransfer,
  receiveTransfer,
  getMultiSiteInventory,
  getTransferStats,
} from '../controllers/transfersController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { requireFeature } from '../middleware/planEnforcement.js';

const router = express.Router();

/**
 * POST /api/transfers
 * Create transfer request
 */
router.post('/',
  authenticate,
  authorize(['ADMIN', 'MANAGER']),
  requireFeature('multi_location'),
  createTransfer
);

/**
 * GET /api/transfers
 * Get all transfers
 */
router.get('/',
  authenticate,
  requireFeature('multi_location'),
  getTransfers
);

/**
 * GET /api/transfers/stats
 * Get transfer statistics
 */
router.get('/stats',
  authenticate,
  authorize(['ADMIN', 'MANAGER']),
  requireFeature('multi_location'),
  getTransferStats
);

/**
 * GET /api/transfers/inventory/:sku
 * Get multi-site inventory for SKU
 */
router.get('/inventory/:sku',
  authenticate,
  requireFeature('multi_location'),
  getMultiSiteInventory
);

/**
 * GET /api/transfers/:id
 * Get single transfer
 */
router.get('/:id',
  authenticate,
  requireFeature('multi_location'),
  getTransfer
);

/**
 * POST /api/transfers/:id/approve
 * Approve transfer
 */
router.post('/:id/approve',
  authenticate,
  authorize(['ADMIN', 'MANAGER']),
  requireFeature('multi_location'),
  approveTransfer
);

/**
 * POST /api/transfers/:id/ship
 * Ship transfer
 */
router.post('/:id/ship',
  authenticate,
  requireFeature('multi_location'),
  shipTransfer
);

/**
 * POST /api/transfers/:id/receive
 * Receive transfer
 */
router.post('/:id/receive',
  authenticate,
  requireFeature('multi_location'),
  receiveTransfer
);

export default router;
