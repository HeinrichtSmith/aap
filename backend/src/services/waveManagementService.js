/**
 * WAVE MANAGEMENT SERVICE
 * 
 * Plan and release waves of orders for batch processing.
 * Efficient processing of 100+ orders.
 * 
 * Features:
 * - Create waves with criteria (courier, priority, cutoff)
 * - Automatic inventory reservation
 * - Wave release (creates batches)
 * - Wave progress tracking
 * - Cancellation support
 */

import prisma from '../config/database.js';
import { stockLockService } from './stockLockService.js';
import { batchPickingService } from './batchPickingService.js';
import logger from '../utils/logger.js';

/**
 * Create a wave
 */
export async function createWave(params) {
  const {
    siteId,
    name,
    courier,
    priority,
    cutoffTime,
    createdBy,
  } = params;

  // Validate cutoff time
  if (cutoffTime && new Date(cutoffTime) < new Date()) {
    throw new Error('Cutoff time must be in the future');
  }

  // Find orders matching criteria
  const orders = await prisma.order.findMany({
    where: {
      siteId,
      status: 'CONFIRMED',
      ...(courier && { courier }),
      ...(priority && { priority }),
      ...(cutoffTime && {
        createdAt: { lte: new Date(cutoffTime) },
      }),
    },
    include: {
      items: true,
    },
  });

  // Filter out orders already in waves or batches
  const inWaveOrders = await prisma.waveOrder.findMany({
    where: {
      wave: { siteId, status: { in: ['PENDING', 'RELEASED', 'IN_PROGRESS'] } },
    },
    select: { orderId: true },
  });
  const inWaveOrderIds = inWaveOrders.map(wo => wo.orderId);

  const availableOrders = orders.filter(o => !inWaveOrderIds.includes(o.id));

  if (availableOrders.length === 0) {
    throw new Error('No orders match wave criteria');
  }

  // Calculate wave totals
  const totalOrders = availableOrders.length;
  const totalItems = availableOrders.reduce(
    (sum, o) => sum + o.items.reduce((is, i) => is + i.quantity, 0),
    0
  );

  // Create wave
  const wave = await prisma.wave.create({
    data: {
      siteId,
      name: name || `Wave-${Date.now()}`,
      courier,
      priority,
      cutoffTime: cutoffTime ? new Date(cutoffTime) : null,
      totalOrders,
      totalItems,
      status: 'PENDING',
      createdBy,
      waveOrders: {
        create: availableOrders.map(order => ({
          orderId: order.id,
        })),
      },
    },
    include: {
      waveOrders: {
        include: {
          order: {
            include: {
              items: true,
              customer: true,
            },
          },
        },
      },
    },
  });

  logger.info(
    `Wave created: ${wave.id} - ${totalOrders} orders, ${totalItems} items`
  );

  return {
    success: true,
    wave,
  };
}

/**
 * Release a wave
 * Reserves inventory and creates batches
 */
export async function releaseWave(waveId, releasedBy) {
  const wave = await prisma.wave.findUnique({
    where: { id: waveId },
    include: {
      waveOrders: {
        include: {
          order: {
            include: {
              items: true,
            },
          },
        },
      },
    },
  });

  if (!wave) {
    throw new Error('Wave not found');
  }

  if (wave.status !== 'PENDING') {
    throw new Error(`Cannot release wave in ${wave.status} status`);
  }

  // Reserve inventory for all orders
  const inventoryLocks = [];
  for (const waveOrder of wave.waveOrders) {
    const order = waveOrder.order;

    for (const item of order.items) {
      try {
        const lockResult = await stockLockService.reserveStock({
          sku: item.sku,
          quantity: item.quantity,
          binLocation: item.binLocation,
          operationType: 'ORDER_PICK',
          operatorId: releasedBy,
          orderId: order.id,
        });

        if (lockResult.success) {
          inventoryLocks.push({
            orderId: order.id,
            lockId: lockResult.lockId,
            sku: item.sku,
            quantity: item.quantity,
          });
        }
      } catch (error) {
        // Rollback all locks on error
        for (const lock of inventoryLocks) {
          await stockLockService.rollbackLock(lock.lockId, releasedBy);
        }
        throw new Error(
          `Failed to reserve inventory for order ${order.orderNumber}: ${error.message}`
        );
      }
    }
  }

  // Update wave status
  await prisma.wave.update({
    where: { id: waveId },
    data: {
      status: 'RELEASED',
      releasedAt: new Date(),
      releasedBy,
    },
  });

  // Update order statuses
  for (const waveOrder of wave.waveOrders) {
    await prisma.order.update({
      where: { id: waveOrder.orderId },
      data: { status: 'ALLOTTED' },
    });
  }

  logger.info(
    `Wave ${waveId} released - ${inventoryLocks.length} inventory locks created`
  );

  return {
    success: true,
    wave,
    inventoryLocks,
  };
}

/**
 * Create batches from released wave
 */
export async function batchWave(waveId, batchedBy) {
  const wave = await prisma.wave.findUnique({
    where: { id: waveId },
  });

  if (!wave) {
    throw new Error('Wave not found');
  }

  if (wave.status !== 'RELEASED') {
    throw new Error('Cannot batch wave in ${wave.status} status');
  }

  // Create batches using batch picking service
  const batchResult = await batchPickingService.createBatches({
    siteId: wave.siteId,
    groupByCourier: true,
    priorityFirst: true,
    createdBy: batchedBy,
  });

  // Update wave status
  const updated = await prisma.wave.update({
    where: { id: waveId },
    data: {
      status: 'IN_PROGRESS',
      batchedAt: new Date(),
      batchesCount: batchResult.batches.length,
    },
  });

  logger.info(
    `Wave ${waveId} batched - ${batchResult.batches.length} batches created`
  );

  return {
    success: true,
    wave: updated,
    batches: batchResult.batches,
  };
}

/**
 * Complete a wave
 */
export async function completeWave(waveId, completedBy) {
  const wave = await prisma.wave.findUnique({
    where: { id: waveId },
    include: {
      waveOrders: {
        include: {
          order: true,
        },
      },
    },
  });

  if (!wave) {
    throw new Error('Wave not found');
  }

  if (wave.status !== 'IN_PROGRESS') {
    throw new Error(`Cannot complete wave in ${wave.status} status`);
  }

  // Update wave status
  const updated = await prisma.wave.update({
    where: { id: waveId },
    data: {
      status: 'COMPLETED',
      completedAt: new Date(),
    },
  });

  logger.info(`Wave ${waveId} completed by ${completedBy}`);

  return {
    success: true,
    wave: updated,
  };
}

/**
 * Cancel a wave
 */
export async function cancelWave(waveId, cancelledBy, reason) {
  const wave = await prisma.wave.findUnique({
    where: { id: waveId },
    include: {
      waveOrders: {
        include: {
          order: {
            include: {
              items: true,
            },
          },
        },
      },
    },
  });

  if (!wave) {
    throw new Error('Wave not found');
  }

  if (wave.status === 'COMPLETED') {
    throw new Error('Cannot cancel completed wave');
  }

  // Release inventory locks if wave was released
  if (wave.status === 'RELEASED' || wave.status === 'IN_PROGRESS') {
    for (const waveOrder of wave.waveOrders) {
      const order = waveOrder.order;

      // Find locks for this order
      const locks = await prisma.stockLock.findMany({
        where: {
          orderId: order.id,
          status: 'LOCKED',
        },
      });

      // Release locks
      for (const lock of locks) {
        try {
          await stockLockService.rollbackLock(lock.id, cancelledBy);
        } catch (error) {
          logger.error(
            `Failed to release lock ${lock.id}: ${error.message}`
          );
        }
      }
    }
  }

  // Reset order statuses
  if (wave.status !== 'CANCELLED') {
    for (const waveOrder of wave.waveOrders) {
      await prisma.order.update({
        where: { id: waveOrder.orderId },
        data: {
          status: 'CONFIRMED',
          pickedBy: null,
        },
      });
    }
  }

  // Update wave status
  const updated = await prisma.wave.update({
    where: { id: waveId },
    data: {
      status: 'CANCELLED',
      cancelledAt: new Date(),
      cancelledBy,
      cancelReason: reason,
    },
  });

  logger.info(`Wave ${waveId} cancelled: ${reason}`);

  return {
    success: true,
    wave: updated,
  };
}

/**
 * Get wave statistics
 */
export async function getWaveStats(siteId, startDate, endDate) {
  const where = { siteId };

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  const [
    total,
    pending,
    released,
    inProgress,
    completed,
    cancelled,
    avgOrdersPerWave,
    avgItemsPerWave,
    wavesByCourier,
    wavesByPriority,
  ] = await Promise.all([
    prisma.wave.count({ where }),
    prisma.wave.count({ where: { ...where, status: 'PENDING' } }),
    prisma.wave.count({ where: { ...where, status: 'RELEASED' } }),
    prisma.wave.count({ where: { ...where, status: 'IN_PROGRESS' } }),
    prisma.wave.count({ where: { ...where, status: 'COMPLETED' } }),
    prisma.wave.count({ where: { ...where, status: 'CANCELLED' } }),
    prisma.wave.aggregate({
      where: { ...where, status: 'COMPLETED' },
      _avg: { totalOrders: true, totalItems: true },
    }),
    prisma.wave.groupBy({
      by: ['courier'],
      where: { ...where, status: 'COMPLETED' },
      _count: { id: true },
    }),
    prisma.wave.groupBy({
      by: ['priority'],
      where: { ...where, status: 'COMPLETED' },
      _count: { id: true },
    }),
  ]);

  return {
    total,
    pending,
    released,
    inProgress,
    completed,
    cancelled,
    avgOrdersPerWave: Math.round(avgOrdersPerWave._avg.totalOrders || 0),
    avgItemsPerWave: Math.round(avgItemsPerWave._avg.totalItems || 0),
    wavesByCourier: wavesByCourier.map(w => ({
      courier: w.courier || 'NO_COURIER',
      count: w._count.id,
    })),
    wavesByPriority: wavesByPriority.map(w => ({
      priority: w.priority,
      count: w._count.id,
    })),
  };
}

/**
 * Get waves by status
 */
export async function getWavesByStatus(siteId, status) {
  const where = { siteId };
  if (status && status !== 'ALL') {
    where.status = status;
  }

  const waves = await prisma.wave.findMany({
    where,
    include: {
      createdByUser: { select: { name: true } },
      waveOrders: {
        include: {
          order: {
            include: {
              items: true,
              customer: { select: { name: true } },
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return waves;
}

// Export service
export const waveManagementService = {
  createWave,
  releaseWave,
  batchWave,
  completeWave,
  cancelWave,
  getWaveStats,
  getWavesByStatus,
};
