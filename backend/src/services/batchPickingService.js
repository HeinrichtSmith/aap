/**
 * BATCH PICKING SERVICE
 * 
 * Groups orders for efficient multi-order picking.
 * Reduces picker travel time by consolidating orders.
 * 
 * Features:
 * - Auto-group orders (max 8 orders, 50 items)
 * - Courier-based grouping
 * - Priority sorting
 * - Zone-based optimization
 * - Picker assignment
 */

import prisma from '../config/database.js';
import logger from '../utils/logger.js';

const MAX_ORDERS_PER_BATCH = 8;
const MAX_ITEMS_PER_BATCH = 50;
const PRIORITY_ORDER = ['URGENT', 'OVERNIGHT', 'NORMAL', 'LOW'];

/**
 * Create picking batches from pending orders
 */
export async function createBatches(params) {
  const {
    siteId,
    maxOrders = MAX_ORDERS_PER_BATCH,
    maxItems = MAX_ITEMS_PER_BATCH,
    groupByCourier = true,
    priorityFirst = true,
    createdBy,
  } = params;

  // Get pending orders
  let orders = await prisma.order.findMany({
    where: {
      siteId,
      status: 'CONFIRMED',
    },
    include: {
      items: true,
      customer: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  // Filter out orders already in batches
  const inBatchOrders = await prisma.batchOrder.findMany({
    where: {
      batch: { siteId, status: { in: ['PENDING', 'IN_PROGRESS'] } },
    },
    select: { orderId: true },
  });
  const inBatchOrderIds = inBatchOrders.map(bo => bo.orderId);
  orders = orders.filter(o => !inBatchOrderIds.includes(o.id));

  if (orders.length === 0) {
    return {
      success: true,
      batches: [],
      message: 'No pending orders to batch',
    };
  }

  // Sort orders
  if (priorityFirst) {
    orders.sort((a, b) => {
      const priorityA = PRIORITY_ORDER.indexOf(a.priority);
      const priorityB = PRIORITY_ORDER.indexOf(b.priority);
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      return new Date(a.createdAt) - new Date(b.createdAt);
    });
  }

  const batches = [];
  const processedOrders = new Set();

  // Group by courier if enabled
  if (groupByCourier) {
    const ordersByCourier = {};
    orders.forEach(order => {
      const courier = order.courier || 'NO_COURIER';
      if (!ordersByCourier[courier]) {
        ordersByCourier[courier] = [];
      }
      ordersByCourier[courier].push(order);
    });

    // Create batches for each courier
    for (const courier in ordersByCourier) {
      const courierOrders = ordersByCourier[courier];
      let currentBatch = {
        orders: [],
        totalItems: 0,
        courier,
      };

      for (const order of courierOrders) {
        const orderItems = order.items.reduce((sum, item) => sum + item.quantity, 0);

        if (
          currentBatch.orders.length >= maxOrders ||
          currentBatch.totalItems + orderItems > maxItems
        ) {
          // Create current batch
          if (currentBatch.orders.length > 0) {
            const batch = await createBatchFromOrders(currentBatch, siteId, createdBy);
            if (batch) batches.push(batch);
          }
          // Start new batch
          currentBatch = {
            orders: [],
            totalItems: 0,
            courier,
          };
        }

        currentBatch.orders.push(order);
        currentBatch.totalItems += orderItems;
        processedOrders.add(order.id);
      }

      // Create final batch for this courier
      if (currentBatch.orders.length > 0) {
        const batch = await createBatchFromOrders(currentBatch, siteId, createdBy);
        if (batch) batches.push(batch);
      }
    }
  } else {
    // Simple batching without courier grouping
    let currentBatch = {
      orders: [],
      totalItems: 0,
      courier: null,
    };

    for (const order of orders) {
      const orderItems = order.items.reduce((sum, item) => sum + item.quantity, 0);

      if (
        currentBatch.orders.length >= maxOrders ||
        currentBatch.totalItems + orderItems > maxItems
      ) {
        // Create current batch
        if (currentBatch.orders.length > 0) {
          const batch = await createBatchFromOrders(currentBatch, siteId, createdBy);
          if (batch) batches.push(batch);
        }
        // Start new batch
        currentBatch = {
          orders: [],
          totalItems: 0,
          courier: null,
        };
      }

      currentBatch.orders.push(order);
      currentBatch.totalItems += orderItems;
      processedOrders.add(order.id);
    }

    // Create final batch
    if (currentBatch.orders.length > 0) {
      const batch = await createBatchFromOrders(currentBatch, siteId, createdBy);
      if (batch) batches.push(batch);
    }
  }

  logger.info(
    `Created ${batches.length} batches - ${batches.reduce((sum, b) => sum + b.orderCount, 0)} orders`
  );

  return {
    success: true,
    batches,
    totalOrders: processedOrders.size,
  };
}

/**
 * Create a batch from a list of orders
 */
async function createBatchFromOrders(batchData, siteId, createdBy) {
  const { orders, totalItems, courier } = batchData;

  // Calculate zones
  const zones = new Set();
  orders.forEach(order => {
    order.items.forEach(item => {
      if (item.binLocation) {
        zones.add(item.binLocation.split('-')[0]);
      }
    });
  });

  // Create batch
  const batch = await prisma.batch.create({
    data: {
      siteId,
      status: 'PENDING',
      priority: getHighestPriority(orders),
      courier,
      totalOrders: orders.length,
      totalItems,
      zones: Array.from(zones),
      createdBy,
      batchOrders: {
        create: orders.map(order => ({
          orderId: order.id,
        })),
      },
    },
    include: {
      batchOrders: {
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

  return batch;
}

/**
 * Get highest priority from a list of orders
 */
function getHighestPriority(orders) {
  for (const priority of PRIORITY_ORDER) {
    if (orders.some(o => o.priority === priority)) {
      return priority;
    }
  }
  return 'NORMAL';
}

/**
 * Start picking a batch
 */
export async function startBatch(batchId, pickerId) {
  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    include: {
      batchOrders: { include: { order: true } },
    },
  });

  if (!batch) {
    throw new Error('Batch not found');
  }

  if (batch.status !== 'PENDING') {
    throw new Error(`Batch already ${batch.status}`);
  }

  // Update batch
  const updated = await prisma.batch.update({
    where: { id: batchId },
    data: {
      status: 'IN_PROGRESS',
      pickerId,
      startedAt: new Date(),
    },
  });

  // Update order statuses
  await Promise.all(
    batch.batchOrders.map(bo =>
      prisma.order.update({
        where: { id: bo.orderId },
        data: {
          status: 'PICKING',
          pickedBy: pickerId,
        },
      })
    )
  );

  logger.info(`Batch ${batchId} started by picker ${pickerId}`);

  return {
    success: true,
    batch: updated,
  };
}

/**
 * Complete a batch
 */
export async function completeBatch(batchId, pickerId) {
  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    include: {
      batchOrders: { include: { order: true } },
    },
  });

  if (!batch) {
    throw new Error('Batch not found');
  }

  if (batch.status !== 'IN_PROGRESS') {
    throw new Error(`Cannot complete batch in ${batch.status} status`);
  }

  // Update batch
  const updated = await prisma.batch.update({
    where: { id: batchId },
    data: {
      status: 'COMPLETED',
      completedAt: new Date(),
    },
  });

  // Update order statuses to PACKED
  await Promise.all(
    batch.batchOrders.map(bo =>
      prisma.order.update({
        where: { id: bo.orderId },
        data: {
          status: 'PACKED',
        },
      })
    )
  );

  logger.info(`Batch ${batchId} completed by picker ${pickerId}`);

  return {
    success: true,
    batch: updated,
  };
}

/**
 * Cancel a batch
 */
export async function cancelBatch(batchId, cancelledBy, reason) {
  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    include: {
      batchOrders: { include: { order: true } },
    },
  });

  if (!batch) {
    throw new Error('Batch not found');
  }

  if (batch.status === 'COMPLETED') {
    throw new Error('Cannot cancel completed batch');
  }

  // Update batch
  const updated = await prisma.batch.update({
    where: { id: batchId },
    data: {
      status: 'CANCELLED',
      cancelledAt: new Date(),
      cancelledBy,
      cancelReason: reason,
    },
  });

  // Reset order statuses to CONFIRMED
  if (batch.status !== 'CANCELLED') {
    await Promise.all(
      batch.batchOrders.map(bo =>
        prisma.order.update({
          where: { id: bo.orderId },
          data: {
            status: 'CONFIRMED',
            pickedBy: null,
          },
        })
      )
    );
  }

  logger.info(`Batch ${batchId} cancelled: ${reason}`);

  return {
    success: true,
    batch: updated,
  };
}

/**
 * Get batch statistics
 */
export async function getBatchStats(siteId, startDate, endDate) {
  const where = { siteId };

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  const [
    total,
    pending,
    inProgress,
    completed,
    cancelled,
    avgOrdersPerBatch,
    avgItemsPerBatch,
    batchesByCourier,
  ] = await Promise.all([
    prisma.batch.count({ where }),
    prisma.batch.count({ where: { ...where, status: 'PENDING' } }),
    prisma.batch.count({ where: { ...where, status: 'IN_PROGRESS' } }),
    prisma.batch.count({ where: { ...where, status: 'COMPLETED' } }),
    prisma.batch.count({ where: { ...where, status: 'CANCELLED' } }),
    prisma.batch.aggregate({
      where: { ...where, status: 'COMPLETED' },
      _avg: { totalOrders: true, totalItems: true },
    }),
    prisma.batch.groupBy({
      by: ['courier'],
      where: { ...where, status: 'COMPLETED' },
      _count: { id: true },
    }),
  ]);

  return {
    total,
    pending,
    inProgress,
    completed,
    cancelled,
    avgOrdersPerBatch: Math.round(avgOrdersPerBatch._avg.totalOrders || 0),
    avgItemsPerBatch: Math.round(avgItemsPerBatch._avg.totalItems || 0),
    batchesByCourier: batchesByCourier.map(b => ({
      courier: b.courier,
      count: b._count.id,
    })),
  };
}

/**
 * Get batches by status
 */
export async function getBatchesByStatus(siteId, status) {
  const where = { siteId };
  if (status && status !== 'ALL') {
    where.status = status;
  }

  const batches = await prisma.batch.findMany({
    where,
    include: {
      picker: { select: { id: true, name: true } },
      batchOrders: {
        include: {
          order: {
            include: {
              customer: { select: { name: true } },
              items: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return batches;
}

// Export service
export const batchPickingService = {
  createBatches,
  startBatch,
  completeBatch,
  cancelBatch,
  getBatchStats,
  getBatchesByStatus,
};
