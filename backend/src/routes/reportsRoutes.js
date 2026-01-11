/**
 * REPORTS ROUTES
 * 
 * Routes for reporting and analytics operations.
 * Business intelligence and data export capabilities.
 */

import express from 'express';
import {
  getInventoryHealth,
  getZoneInventory,
  getOrderPerformance,
  getPickerPerformance,
  getInsights,
  getWarehouseMap,
  calculateTravelDistance,
  getVelocityGroups,
  exportReport,
} from '../controllers/reportsController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { requireFeature } from '../middleware/planEnforcement.js';

const router = express.Router();

/**
 * GET /api/reports/inventory/health
 * Get inventory health summary
 */
router.get('/inventory/health',
  authenticate,
  requireFeature('reporting'),
  getInventoryHealth
);

/**
 * GET /api/reports/inventory/zones
 * Get zone-level inventory summary
 */
router.get('/inventory/zones',
  authenticate,
  requireFeature('reporting'),
  getZoneInventory
);

/**
 * GET /api/reports/inventory/velocity
 * Get velocity groups (pick frequency analysis)
 */
router.get('/inventory/velocity',
  authenticate,
  requireFeature('reporting'),
  getVelocityGroups
);

/**
 * GET /api/reports/orders/performance
 * Get order performance report
 */
router.get('/orders/performance',
  authenticate,
  authorize(['ADMIN', 'MANAGER']),
  requireFeature('reporting'),
  getOrderPerformance
);

/**
 * GET /api/reports/pickers/performance
 * Get picker performance report
 */
router.get('/pickers/performance',
  authenticate,
  authorize(['ADMIN', 'MANAGER']),
  requireFeature('reporting'),
  getPickerPerformance
);

/**
 * GET /api/reports/insights
 * Get actionable insights
 */
router.get('/insights',
  authenticate,
  authorize(['ADMIN', 'MANAGER']),
  requireFeature('reporting'),
  getInsights
);

/**
 * GET /api/reports/warehouse/map
 * Get warehouse map
 */
router.get('/warehouse/map',
  authenticate,
  requireFeature('reporting'),
  getWarehouseMap
);

/**
 * POST /api/reports/picks/travel-distance
 * Calculate travel distance for pick path
 */
router.post('/picks/travel-distance',
  authenticate,
  requireFeature('reporting'),
  calculateTravelDistance
);

/**
 * GET /api/reports/export/:type
 * Export report as CSV
 */
router.get('/export/:type',
  authenticate,
  authorize(['ADMIN', 'MANAGER']),
  requireFeature('reporting'),
  exportReport
);

export default router;
