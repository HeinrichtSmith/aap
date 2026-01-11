/**
 * BATCH PICKING CONTROLLER
 * 
 * Manages batch creation, assignment, and completion.
 * Integrates with stock lock protocol for atomic operations.
 */

import prisma from '../config/database.js';
import { batchPickingService } from '../services/batchPickingService.js';
import logger from '../utils/logger.js';
import { formatErrorResponse } from '../utils/errorCodes.js';

/**
 * Create batches from pending orders
 * POST /api/batches/create
 * Requires: ADMIN/MANAGER
 */
export const createBatches = async (req, res, next) => {
  try {
    const { maxOrdersPerBatch, maxItemsPerBatch, groupByCourier, priorityFirst } = req.body;

    const result = await batchPickingService.createBatches({
      companyId: req.user.companyId,
      siteId: req.user.siteId,
      maxOrdersPerBatch: maxOrdersPerBatch || 8,
      maxItemsPerBatch: maxItemsPerBatch || 50,
      groupByCourier: groupByCourier !== false,
      priorityFirst: priorityFirst !== false,
    });

    logger.info(`Batches created: ${result.batches.length} batches with ${result.totalOrders} orders by ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: `${result.batches.length} batches created from ${result.totalOrders} orders`,
      data: result,
    });
  } catch (error) {
    logger.error('Error creating batches:', error);
    next(error);
  }
};

/**
 * Get all batches
 * GET /api/batches
 * Requires: All authenticated users
 */
export const getBatches = async (req, res, next) => {
  try {
    const { status, assignedPicker, page = 1, limit = 50 } = req.query;

    const where = {};

    // Filter by user's company
    if (req.user.role !== 'ADMIN' && req.user.companyId) {
      // Need to join through orders to filter by company
      const orders = await prisma.order.findMany({
        where: { companyId: req.user.companyId },
        select: { id: true },
      });
      const orderIds = orders.map(o => o.id);
      const batchOrders = await prisma.batchOrder.findMany({
        where: { orderId: { in: orderIds } },
        select: { batchId: true },
      });
      where.id = { in: batchOrders.map(bo => bo.batchId) };
    }

    // Pickers see only batches assigned to them
    if (req.user.role === 'PICKER') {
      const batchOrders = await prisma.batchOrder.findMany({
        where: {
          order: {
            assignedPickerId: req.user.id,
          },
        },
        select: { batchId: true },
      });
      where.id = { in: batchOrders.map(bo => bo.batchId) };
    }

    if (status) where.status = status;
    if (assignedPicker) {
      const batchOrders = await prisma.batchOrder.findMany({
        where: {
          order: { assignedPickerId: assignedPicker },
        },
        select: { batchId: true },
      });
      where.id = { in: batchOrders.map(bo => bo.batchId) };
    }

    const batches = await prisma.batch.findMany({
      where,
      include: {
        orders: {
          include: {
            order: {
              include: {
                items: true,
                assignedPicker: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
      orderBy: [
        { status: 'asc' },
        { createdAt: 'desc' },
      ],
      skip: (page - 1) * limit,
      take: parseInt(limit),
    });

    const total = await prisma.batch.count({ where });

    res.json({
      success: true,
      batches,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Error fetching batches:', error);
    next(error);
  }
};

/**
 * Get single batch
 * GET /api/batches/:id
 * Requires: All authenticated users
 */
export const getBatch = async (req, res, next) => {
  try {
    const { id } = req.params;

    const batch = await prisma.batch.findUnique({
      where: { id },
      include: {
        orders: {
          orderBy: { priority: 'desc' },
          include: {
            order: {
              include: {
                items: true,
                assignedPicker: { select: { id: true, name: true } },
                site: { select: { code: true, name: true } },
              },
            },
          },
        },
      },
    });

    if (!batch) {
      return res.status(404).json(formatErrorResponse('DATA_004_NOT_FOUND', 'Batch not found'));
    }

    res.json({
      success: true,
      batch,
    });
  } catch (error) {
    logger.error('Error fetching batch:', error);
    next(error);
  }
};

/**
 * Start batch (assign to picker)
 * POST /api/batches/:id/start
 * Requires: PICKER or ADMIN/MANAGER
 */
export const startBatch = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { pickerId } = req.body;

    // Use requesting picker if not specified
    const targetPickerId = pickerId || req.user.id;

    // Verify picker exists
    const picker = await prisma.user.findFirst({
      where: {
        id: targetPickerId,
        role: { in: ['PICKER', 'ADMIN', 'MANAGER'] },
      },
    });

    if (!picker) {
      return res.status(400).json(formatErrorResponse('AUTH_003_FORBIDDEN', 'Invalid picker'));
    }

    const batch = await prisma.batch.update({
      where: { id },
      data: {
        status: 'IN_PROGRESS',
        startedAt: new Date(),
      },
      include: {
        orders: {
          include: {
            order: {
              select: { id: true, items: true },
            },
          },
        },
      },
    });

    // Assign picker to all orders in batch
    const orderIds = batch.orders.map(bo => bo.order.id);
    await prisma.order.updateMany({
      where: {
        id: { in: orderIds },
        assignedPickerId: null,
      },
      data: {
        assignedPickerId: targetPickerId,
        status: 'PICKING',
      },
    });

    logger.info(`Batch ${id} started by ${req.user.email}, assigned to ${targetPickerId}`);

    res.json({
      success: true,
      message: 'Batch started successfully',
      batch,
    });
  } catch (error) {
    logger.error('Error starting batch:', error);
    next(error);
  }
};

/**
 * Complete batch
 * POST /api/batches/:id/complete
 * Requires: PICKER (assigned) or ADMIN/MANAGER
 */
export const completeBatch = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verify all orders in batch are ready to pack
    const batch = await prisma.batch.findUnique({
      where: { id },
      include: {
        orders: {
          include: {
            order: true,
          },
        },
      },
    });

    if (!batch) {
      return res.status(404).json(formatErrorResponse('DATA_004_NOT_FOUND', 'Batch not found'));
    }

    const allReadyToPack = batch.orders.every(
      bo => bo.order.status === 'READY_TO_PACK' || bo.order.status === 'PACKED'
    );

    if (!allReadyToPack) {
      return res.status(400).json({
        success: false,
        error: 'InvalidState',
        message: 'Cannot complete batch - not all orders are ready to pack',
      });
    }

    const updatedBatch = await prisma.batch.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    logger.info(`Batch ${id} completed by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Batch completed successfully',
      batch: updatedBatch,
    });
  } catch (error) {
    logger.error('Error completing batch:', error);
    next(error);
  }
};

/**
 * Cancel batch
 * POST /api/batches/:id/cancel
 * Requires: ADMIN/MANAGER
 */
export const cancelBatch = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const batch = await prisma.batch.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        notes: reason || 'Batch cancelled',
      },
    });

    // Unassign picker from all orders in batch
    const batchOrders = await prisma.batchOrder.findMany({
      where: { batchId: id },
      select: { orderId: true },
    });
    const orderIds = batchOrders.map(bo => bo.orderId);

    await prisma.order.updateMany({
      where: {
        id: { in: orderIds },
        status: 'PICKING',
      },
      data: {
        assignedPickerId: null,
        status: 'PENDING',
      },
    });

    logger.info(`Batch ${id} cancelled by ${req.user.email}: ${reason}`);

    res.json({
      success: true,
      message: 'Batch cancelled successfully',
      batch,
    });
  } catch (error) {
    logger.error('Error cancelling batch:', error);
    next(error);
  }
};

/**
 * Get batch statistics
 * GET /api/batches/stats
 * Requires: ADMIN/MANAGER
 */
export const getBatchStats = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    const where = {
      ...(startDate || endDate) && { createdAt: dateFilter },
    };

    // Filter by company if not admin
    if (req.user.role !== 'ADMIN' && req.user.companyId) {
      const orders = await prisma.order.findMany({
        where: { companyId: req.user.companyId },
        select: { id: true },
      });
      const orderIds = orders.map(o => o.id);
      const batchOrders = await prisma.batchOrder.findMany({
        where: { orderId: { in: orderIds } },
        select: { batchId: true },
      });
      where.id = { in: batchOrders.map(bo => bo.batchId) };
    }

    const [
      totalBatches,
      pendingBatches,
      inProgressBatches,
      completedBatches,
      cancelledBatches,
    ] = await Promise.all([
      prisma.batch.count({ where }),
      prisma.batch.count({ where: { ...where, status: 'PENDING' } }),
      prisma.batch.count({ where: { ...where, status: 'IN_PROGRESS' } }),
      prisma.batch.count({ where: { ...where, status: 'COMPLETED' } }),
      prisma.batch.count({ where: { ...where, status: 'CANCELLED' } }),
    ]);

    res.json({
      success: true,
      stats: {
        totalBatches,
        pendingBatches,
        inProgressBatches,
        completedBatches,
        cancelledBatches,
      },
    });
  } catch (error) {
    logger.error('Error fetching batch stats:', error);
    next(error);
  }
};
