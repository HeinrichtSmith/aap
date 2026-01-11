/**
 * BATCH PICKING ROUTES
 * 
 * Routes for creating and managing batch picking operations.
 * Integrates with stock lock protocol for atomic operations.
 */

import express from 'express';
import {
  createBatches,
  getBatches,
  getBatch,
  startBatch,
  completeBatch,
  cancelBatch,
  getBatchStats,
} from '../controllers/batchesController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { requireFeature } from '../middleware/planEnforcement.js';

const router = express.Router();

/**
 * POST /api/batches/create
 * Create batches from pending orders
 */
router.post('/create',
  authenticate,
  authorize(['ADMIN', 'MANAGER']),
  requireFeature('batch_picking'),
  createBatches
);

/**
 * GET /api/batches
 * Get all batches
 */
router.get('/',
  authenticate,
  requireFeature('batch_picking'),
  getBatches
);

/**
 * GET /api/batches/stats
 * Get batch statistics
 */
router.get('/stats',
  authenticate,
  authorize(['ADMIN', 'MANAGER']),
  requireFeature('batch_picking'),
  getBatchStats
);

/**
 * GET /api/batches/:id
 * Get single batch
 */
router.get('/:id',
  authenticate,
  requireFeature('batch_picking'),
  getBatch
);

/**
 * POST /api/batches/:id/start
 * Start batch (assign to picker)
 */
router.post('/:id/start',
  authenticate,
  authorize(['PICKER', 'ADMIN', 'MANAGER']),
  requireFeature('batch_picking'),
  startBatch
);

/**
 * POST /api/batches/:id/complete
 * Complete batch
 */
router.post('/:id/complete',
  authenticate,
  authorize(['PICKER', 'ADMIN', 'MANAGER']),
  requireFeature('batch_picking'),
  completeBatch
);

/**
 * POST /api/batches/:id/cancel
 * Cancel batch
 */
router.post('/:id/cancel',
  authenticate,
  authorize(['ADMIN', 'MANAGER']),
  requireFeature('batch_picking'),
  cancelBatch
);

export default router;
