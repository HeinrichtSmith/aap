/**
 * DISCREPANCY MANAGEMENT ROUTES
 * 
 * Routes for reporting, tracking, and resolving inventory discrepancies.
 * Integrates with stock lock protocol for atomic operations.
 */

import express from 'express';
import { discrepancyService } from '../services/discrepancyService.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateRequest } from '../utils/validators.js';
import logger from '../utils/logger.js';
import { formatErrorResponse } from '../utils/errorCodes.js';

const router = express.Router();

/**
 * GET /api/discrepancies
 * Get all discrepancies with filtering
 */
router.get('/', 
  authenticate, 
  validateRequest({
    query: {
      status: { type: 'string', optional: true },
      binLocation: { type: 'string', optional: true },
      sku: { type: 'string', optional: true },
      limit: { type: 'number', optional: true },
      offset: { type: 'number', optional: true }
    }
  }),
  async (req, res, next) => {
    try {
      const { status, binLocation, sku, limit = 50, offset = 0 } = req.query;
      
      const filters = {};
      if (status) filters.status = status;
      if (binLocation) filters.binLocation = { contains: binLocation };
      if (sku) filters.sku = { contains: sku };

      const discrepancies = await discrepancyService.getDiscrepancies(filters, {
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.json({
        success: true,
        data: discrepancies
      });
    } catch (error) {
      logger.error('Error fetching discrepancies:', error);
      next(error);
    }
  }
);

/**
 * GET /api/discrepancies/:id
 * Get discrepancy by ID
 */
router.get('/:id',
  authenticate,
  async (req, res, next) => {
    try {
      const discrepancy = await discrepancyService.getDiscrepancyById(req.params.id);

      if (!discrepancy) {
        return res.status(404).json(formatErrorResponse('DATA_004_NOT_FOUND', 
          `Discrepancy with ID ${req.params.id} not found`));
      }

      res.json({
        success: true,
        data: discrepancy
      });
    } catch (error) {
      logger.error('Error fetching discrepancy:', error);
      next(error);
    }
  }
);

/**
 * POST /api/discrepancies
 * Report a new discrepancy
 * 
 * Creates:
 * - Discrepancy record
 * - Cycle count task
 * - Flags inventory for audit
 * - Activity log
 */
router.post('/',
  authenticate,
  authorize(['ADMIN', 'MANAGER', 'PICKER', 'RECEIVER']),
  validateRequest({
    body: {
      binLocation: { type: 'string', required: true },
      sku: { type: 'string', required: true },
      expectedQuantity: { type: 'number', required: true },
      actualQuantity: { type: 'number', required: true },
      photoEvidence: { type: 'string', optional: true },
      notes: { type: 'string', optional: true }
    }
  }),
  async (req, res, next) => {
    try {
      const { binLocation, sku, expectedQuantity, actualQuantity, photoEvidence, notes } = req.body;

      const result = await discrepancyService.reportDiscrepancy({
        binLocation,
        sku,
        expectedQuantity,
        actualQuantity,
        reportedBy: req.user.id,
        photoEvidence,
        notes
      });

      logger.info(`Discrepancy reported by ${req.user.name}: ${sku} at ${binLocation}`);

      res.status(201).json({
        success: true,
        data: result,
        message: 'Discrepancy reported and cycle count task created'
      });
    } catch (error) {
      logger.error('Error reporting discrepancy:', error);
      next(error);
    }
  }
);

/**
 * PUT /api/discrepancies/:id/resolve
 * Resolve a discrepancy with verified count
 */
router.put('/:id/resolve',
  authenticate,
  authorize(['ADMIN', 'MANAGER', 'SUPERVISOR']),
  validateRequest({
    body: {
      actualQuantity: { type: 'number', required: true },
      resolutionNotes: { type: 'string', optional: true }
    }
  }),
  async (req, res, next) => {
    try {
      const { actualQuantity, resolutionNotes } = req.body;

      const resolved = await discrepancyService.resolveDiscrepancy(
        req.params.id,
        actualQuantity,
        req.user.id,
        resolutionNotes
      );

      logger.info(`Discrepancy ${req.params.id} resolved by ${req.user.name}`);

      res.json({
        success: true,
        data: resolved,
        message: 'Discrepancy resolved and inventory adjusted'
      });
    } catch (error) {
      logger.error('Error resolving discrepancy:', error);
      next(error);
    }
  }
);

/**
 * PUT /api/discrepancies/:id/ignore
 * Ignore a discrepancy (mark as reviewed but no action)
 */
router.put('/:id/ignore',
  authenticate,
  authorize(['ADMIN', 'MANAGER']),
  async (req, res, next) => {
    try {
      const ignored = await discrepancyService.ignoreDiscrepancy(
        req.params.id,
        req.user.id,
        req.body.notes
      );

      logger.info(`Discrepancy ${req.params.id} ignored by ${req.user.name}`);

      res.json({
        success: true,
        data: ignored,
        message: 'Discrepancy marked as ignored'
      });
    } catch (error) {
      logger.error('Error ignoring discrepancy:', error);
      next(error);
    }
  }
);

/**
 * GET /api/discrepancies/stats
 * Get discrepancy statistics (30-day window)
 */
router.get('/stats/summary',
  authenticate,
  authorize(['ADMIN', 'MANAGER']),
  async (req, res, next) => {
    try {
      const stats = await discrepancyService.getDiscrepancyStats(30);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Error fetching discrepancy stats:', error);
      next(error);
    }
  }
);

export default router;
