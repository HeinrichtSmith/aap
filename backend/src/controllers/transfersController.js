/**
 * INVENTORY TRANSFERS CONTROLLER
 * 
 * Handles cross-site inventory transfer operations.
 * REST API for multi-location inventory management.
 */

import prisma from '../config/database.js';
import { multiLocationService } from '../services/multiLocationService.js';
import logger from '../utils/logger.js';

/**
 * Create transfer request
 * POST /api/transfers
 * Requires: ADMIN/MANAGER
 */
export const createTransfer = async (req, res, next) => {
  try {
    const transfer = await multiLocationService.createTransfer({
      ...req.body,
      requestedBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: 'Transfer request created',
      transfer: transfer.transfer,
      lockId: transfer.lockId,
    });
  } catch (error) {
    logger.error('Error creating transfer:', error);
    next(error);
  }
};

/**
 * Get all transfers
 * GET /api/transfers
 * Requires: All authenticated users
 */
export const getTransfers = async (req, res, next) => {
  try {
    const { status, fromSiteId, toSiteId, page = 1, limit = 50 } = req.query;

    const where = {
      OR: [
        { fromSite: { companyId: req.user.companyId } },
        { toSite: { companyId: req.user.companyId } },
      ],
    };

    // Filter by user's site if not admin
    if (req.user.role !== 'ADMIN' && req.user.siteId) {
      where.OR = [
        { fromSiteId: req.user.siteId },
        { toSiteId: req.user.siteId },
      ];
    }

    if (status) where.status = status.toUpperCase();
    if (fromSiteId) where.fromSiteId = fromSiteId;
    if (toSiteId) where.toSiteId = toSiteId;

    const transfers = await prisma.inventoryTransfer.findMany({
      where,
      include: {
        fromSite: { select: { id: true, name: true } },
        toSite: { select: { id: true, name: true } },
        requestedBy: { select: { id: true, name: true } },
        approvedBy: { select: { id: true, name: true } },
        shippedBy: { select: { id: true, name: true } },
        receivedBy: { select: { id: true, name: true } },
        product: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: parseInt(limit),
    });

    const total = await prisma.inventoryTransfer.count({ where });

    res.json({
      success: true,
      transfers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Error fetching transfers:', error);
    next(error);
  }
};

/**
 * Get single transfer
 * GET /api/transfers/:id
 */
export const getTransfer = async (req, res, next) => {
  try {
    const { id } = req.params;

    const where = { id };
    
    // Non-admin users can only access transfers at their site
    if (req.user.role !== 'ADMIN' && req.user.siteId) {
      where.OR = [
        { fromSiteId: req.user.siteId },
        { toSiteId: req.user.siteId },
      ];
    }

    const transfer = await prisma.inventoryTransfer.findFirst({
      where,
      include: {
        fromSite: true,
        toSite: true,
        requestedBy: true,
        approvedBy: true,
        shippedBy: true,
        receivedBy: true,
        product: true,
      },
    });

    if (!transfer) {
      return res.status(404).json({
        success: false,
        error: 'NotFound',
        message: 'Transfer not found',
      });
    }

    res.json({ success: true, transfer });
  } catch (error) {
    logger.error('Error fetching transfer:', error);
    next(error);
  }
};

/**
 * Approve transfer
 * POST /api/transfers/:id/approve
 * Requires: ADMIN/MANAGER
 */
export const approveTransfer = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await multiLocationService.approveTransfer(id, req.user.id);

    res.json({
      success: true,
      message: 'Transfer approved',
      transfer: result.transfer,
    });
  } catch (error) {
    logger.error('Error approving transfer:', error);
    next(error);
  }
};

/**
 * Ship transfer
 * POST /api/transfers/:id/ship
 * Requires: Any authenticated user at source site
 */
export const shipTransfer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { trackingNumber } = req.body;

    const result = await multiLocationService.shipTransfer(id, req.user.id, trackingNumber);

    res.json({
      success: true,
      message: 'Transfer shipped',
      transfer: result.transfer,
    });
  } catch (error) {
    logger.error('Error shipping transfer:', error);
    next(error);
  }
};

/**
 * Receive transfer
 * POST /api/transfers/:id/receive
 * Requires: Any authenticated user at destination site
 */
export const receiveTransfer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { actualQuantity, binLocation } = req.body;

    const result = await multiLocationService.receiveTransfer(
      id,
      req.user.id,
      actualQuantity,
      binLocation
    );

    res.json({
      success: true,
      message: 'Transfer received',
      transfer: result.transfer,
      inventory: result.inventory,
      discrepancy: result.discrepancy,
    });
  } catch (error) {
    logger.error('Error receiving transfer:', error);
    next(error);
  }
};

/**
 * Get multi-site inventory for SKU
 * GET /api/transfers/inventory/:sku
 */
export const getMultiSiteInventory = async (req, res, next) => {
  try {
    const { sku } = req.params;

    const inventory = await multiLocationService.getMultiSiteInventory(
      req.user.companyId,
      sku
    );

    res.json({ success: true, inventory });
  } catch (error) {
    logger.error('Error fetching multi-site inventory:', error);
    next(error);
  }
};

/**
 * Get transfer statistics
 * GET /api/transfers/stats
 * Requires: ADMIN/MANAGER
 */
export const getTransferStats = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    const where = {
      OR: [
        { fromSite: { companyId: req.user.companyId } },
        { toSite: { companyId: req.user.companyId } },
      ],
    };

    if (startDate || endDate) {
      where.createdAt = dateFilter;
    }

    const [total, pending, approved, inTransit, completed, discrepancyCount] =
      await Promise.all([
        prisma.inventoryTransfer.count({ where }),
        prisma.inventoryTransfer.count({ where: { ...where, status: 'PENDING' } }),
        prisma.inventoryTransfer.count({ where: { ...where, status: 'APPROVED' } }),
        prisma.inventoryTransfer.count({ where: { ...where, status: 'IN_TRANSIT' } }),
        prisma.inventoryTransfer.count({ where: { ...where, status: 'COMPLETED' } }),
        prisma.inventoryTransfer.count({
          where: { ...where, discrepancyId: { not: null } },
        }),
      ]);

    res.json({
      success: true,
      stats: {
        total,
        pending,
        approved,
        inTransit,
        completed,
        discrepancyCount,
      },
    });
  } catch (error) {
    logger.error('Error fetching transfer stats:', error);
    next(error);
  }
};
