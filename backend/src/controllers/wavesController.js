/**
 * WAVE MANAGEMENT CONTROLLER
 * 
 * Manages wave creation, release, and completion.
 * Waves organize batches for efficient picking operations.
 */

import prisma from '../config/database.js';
import { waveManagementService } from '../services/waveManagementService.js';
import logger from '../utils/logger.js';
import { formatErrorResponse } from '../utils/errorCodes.js';

/**
 * Create wave from pending orders
 * POST /api/waves/create
 * Requires: ADMIN/MANAGER
 */
export const createWave = async (req, res, next) => {
  try {
    const { name, scheduledFor, maxOrders, maxBatches, courier, priority, cutoffTime } = req.body;

    const result = await waveManagementService.createWave({
      companyId: req.user.companyId,
      siteId: req.user.siteId,
      name,
      scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
      maxOrders: maxOrders || 100,
      maxBatches: maxBatches || 12,
      courier,
      priority,
      cutoffTime: cutoffTime ? new Date(cutoffTime) : null,
      createdBy: req.user.id,
    });

    logger.info(`Wave created: ${result.wave.id} with ${result.ordersAdded} orders by ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: `Wave created with ${result.ordersAdded} orders`,
      data: result,
    });
  } catch (error) {
    logger.error('Error creating wave:', error);
    next(error);
  }
};

/**
 * Get all waves
 * GET /api/waves
 * Requires: All authenticated users
 */
export const getWaves = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;

    const where = {};

    // Filter by company
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

    if (status) where.status = status;

    const waves = await prisma.wave.findMany({
      where,
      include: {
        batches: {
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
        },
      },
      orderBy: [
        { status: 'asc' },
        { scheduledFor: 'desc' },
        { createdAt: 'desc' },
      ],
      skip: (page - 1) * limit,
      take: parseInt(limit),
    });

    const total = await prisma.wave.count({ where });

    res.json({
      success: true,
      waves,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Error fetching waves:', error);
    next(error);
  }
};

/**
 * Get single wave
 * GET /api/waves/:id
 * Requires: All authenticated users
 */
export const getWave = async (req, res, next) => {
  try {
    const { id } = req.params;

    const wave = await prisma.wave.findUnique({
      where: { id },
      include: {
        batches: {
          orderBy: { createdAt: 'asc' },
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
        },
      },
    });

    if (!wave) {
      return res.status(404).json(formatErrorResponse('DATA_004_NOT_FOUND', 'Wave not found'));
    }

    res.json({
      success: true,
      wave,
    });
  } catch (error) {
    logger.error('Error fetching wave:', error);
    next(error);
  }
};

/**
 * Release wave for picking
 * POST /api/waves/:id/release
 * Requires: ADMIN/MANAGER
 */
export const releaseWave = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await waveManagementService.releaseWave(id, req.user.id);

    logger.info(`Wave ${id} released by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Wave released successfully',
      data: result,
    });
  } catch (error) {
    logger.error('Error releasing wave:', error);
    next(error);
  }
};

/**
 * Cancel wave
 * POST /api/waves/:id/cancel
 * Requires: ADMIN/MANAGER
 */
export const cancelWave = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const wave = await prisma.wave.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        releasedAt: new Date(),
        notes: reason || 'Wave cancelled',
      },
    });

    // Cancel all batches in wave
    const batches = await prisma.batch.findMany({
      where: { waveId: id },
      select: { id: true },
    });

    for (const batch of batches) {
      await prisma.batch.update({
        where: { id: batch.id },
        data: { status: 'CANCELLED' },
      });

      // Unassign orders
      const batchOrders = await prisma.batchOrder.findMany({
        where: { batchId: batch.id },
        select: { orderId: true },
      });
      await prisma.order.updateMany({
        where: {
          id: { in: batchOrders.map(bo => bo.orderId) },
          status: 'PICKING',
        },
        data: {
          assignedPickerId: null,
          status: 'PENDING',
        },
      });
    }

    logger.info(`Wave ${id} cancelled by ${req.user.email}: ${reason}`);

    res.json({
      success: true,
      message: 'Wave cancelled successfully',
      wave,
    });
  } catch (error) {
    logger.error('Error cancelling wave:', error);
    next(error);
  }
};

/**
 * Get wave statistics
 * GET /api/waves/stats
 * Requires: ADMIN/MANAGER
 */
export const getWaveStats = async (req, res, next) => {
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
      const batches = await prisma.batch.findMany({
        where: { id: { in: batchOrders.map(bo => bo.batchId) } },
        select: { waveId: true },
      });
      where.id = { in: batches.map(b => b.waveId).filter(Boolean) };
    }

    const [
      totalWaves,
      pendingWaves,
      releasedWaves,
      inProgressWaves,
      completedWaves,
      cancelledWaves,
    ] = await Promise.all([
      prisma.wave.count({ where }),
      prisma.wave.count({ where: { ...where, status: 'PENDING' } }),
      prisma.wave.count({ where: { ...where, status: 'RELEASED' } }),
      prisma.wave.count({ where: { ...where, status: 'IN_PROGRESS' } }),
      prisma.wave.count({ where: { ...where, status: 'COMPLETED' } }),
      prisma.wave.count({ where: { ...where, status: 'CANCELLED' } }),
    ]);

    res.json({
      success: true,
      stats: {
        totalWaves,
        pendingWaves,
        releasedWaves,
        inProgressWaves,
        completedWaves,
        cancelledWaves,
      },
    });
  } catch (error) {
    logger.error('Error fetching wave stats:', error);
    next(error);
  }
};
