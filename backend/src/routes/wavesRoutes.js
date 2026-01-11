/**
 * WAVE MANAGEMENT ROUTES
 * 
 * Routes for creating and managing wave planning operations.
 * Waves organize batches for efficient picking operations.
 */

import express from 'express';
import {
  createWave,
  getWaves,
  getWave,
  releaseWave,
  cancelWave,
  getWaveStats,
} from '../controllers/wavesController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { requireFeature } from '../middleware/planEnforcement.js';

const router = express.Router();

/**
 * POST /api/waves/create
 * Create wave from pending orders
 */
router.post('/create',
  authenticate,
  authorize(['ADMIN', 'MANAGER']),
  requireFeature('wave_planning'),
  createWave
);

/**
 * GET /api/waves
 * Get all waves
 */
router.get('/',
  authenticate,
  requireFeature('wave_planning'),
  getWaves
);

/**
 * GET /api/waves/stats
 * Get wave statistics
 */
router.get('/stats',
  authenticate,
  authorize(['ADMIN', 'MANAGER']),
  requireFeature('wave_planning'),
  getWaveStats
);

/**
 * GET /api/waves/:id
 * Get single wave
 */
router.get('/:id',
  authenticate,
  requireFeature('wave_planning'),
  getWave
);

/**
 * POST /api/waves/:id/release
 * Release wave for picking
 */
router.post('/:id/release',
  authenticate,
  authorize(['ADMIN', 'MANAGER']),
  requireFeature('wave_planning'),
  releaseWave
);

/**
 * POST /api/waves/:id/cancel
 * Cancel wave
 */
router.post('/:id/cancel',
  authenticate,
  authorize(['ADMIN', 'MANAGER']),
  requireFeature('wave_planning'),
  cancelWave
);

export default router;
