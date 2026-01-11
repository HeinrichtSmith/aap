/**
 * INVENTORY DRIFT & RECONCILIATION SERVICE
 * 
 * Automatic discrepancy detection and management.
 * Self-healing inventory system.
 * 
 * Features:
 * - Automatic variance detection (> 5%)
 * - Discrepancy workflow management
 * - Cycle count generation
 * - Inventory reconciliation
 */

import prisma from '../config/database.js';
import logger from '../utils/logger.js';

const VARIANCE_THRESHOLD = 0.05; // 5%

/**
 * Create a new discrepancy
 */
export async function createDiscrepancy(data) {
  const {
    sku,
    expectedQuantity,
    actualQuantity,
    binLocation,
    siteId,
    reportedBy,
    reason,
    orderId = null,
    transferId = null,
  } = data;

  // Verify inventory exists
  const inventory = await prisma.inventoryItem.findFirst({
    where: {
      sku,
      siteId,
      binLocation,
    },
  });

  if (!inventory) {
    throw new Error(`Inventory item not found: ${sku} at ${binLocation}`);
  }

  // Calculate variance
  const variance = Math.abs(expectedQuantity - actualQuantity);
  const variancePercent = variance / expectedQuantity;

  // Create discrepancy
  const discrepancy = await prisma.discrepancy.create({
    data: {
      sku,
      expectedQuantity,
      actualQuantity,
      variance,
      variancePercent,
      binLocation,
      siteId,
      reportedBy,
      reason,
      orderId,
      transferId,
      status: 'OPEN',
    },
    include: {
      site: { select: { name: true } },
      reportedByUser: { select: { name: true } },
    },
  });

  logger.info(
    `Discrepancy created: ${discrepancy.id} - ${sku} - Variance: ${variancePercent.toFixed(2)}%`
  );

  return {
    success: true,
    discrepancy,
  };
}

/**
 * Detect discrepancy in inventory
 * Automatically creates discrepancy if variance > threshold
 */
export async function detectDiscrepancy(
  sku,
  expectedQuantity,
  actualQuantity,
  binLocation,
  siteId,
  detectedBy,
  context = 'MANUAL_COUNT'
) {
  const variance = Math.abs(expectedQuantity - actualQuantity);
  const variancePercent = variance / expectedQuantity;

  // Only create discrepancy if variance exceeds threshold
  if (variancePercent >= VARIANCE_THRESHOLD) {
    const discrepancy = await createDiscrepancy({
      sku,
      expectedQuantity,
      actualQuantity,
      binLocation,
      siteId,
      reportedBy: detectedBy,
      reason: `Variance detected (${context})`,
    });

    return {
      discrepancyDetected: true,
      variancePercent,
      discrepancy: discrepancy.discrepancy,
    };
  }

  return {
    discrepancyDetected: false,
    variancePercent,
  };
}

/**
 * Investigate discrepancy
 */
export async function investigateDiscrepancy(
  discrepancyId,
  investigatedBy,
  investigationNotes,
  rootCause
) {
  const discrepancy = await prisma.discrepancy.findUnique({
    where: { id: discrepancyId },
  });

  if (!discrepancy) {
    throw new Error('Discrepancy not found');
  }

  if (discrepancy.status !== 'OPEN') {
    throw new Error(`Cannot investigate discrepancy in ${discrepancy.status} status`);
  }

  const updated = await prisma.discrepancy.update({
    where: { id: discrepancyId },
    data: {
      status: 'INVESTIGATING',
      investigatedBy,
      investigatedAt: new Date(),
      investigationNotes,
      rootCause,
    },
  });

  logger.info(
    `Discrepancy investigated: ${discrepancyId} by ${investigatedBy}`
  );

  return {
    success: true,
    discrepancy: updated,
  };
}

/**
 * Resolve discrepancy with inventory adjustment
 */
export async function resolveDiscrepancy(
  discrepancyId,
  resolvedBy,
  resolution,
  adjustInventory = false
) {
  const discrepancy = await prisma.discrepancy.findUnique({
    where: { id: discrepancyId },
  });

  if (!discrepancy) {
    throw new Error('Discrepancy not found');
  }

  if (discrepancy.status !== 'INVESTIGATING') {
    throw new Error(`Cannot resolve discrepancy in ${discrepancy.status} status`);
  }

  // Update inventory if requested
  if (adjustInventory) {
    const inventory = await prisma.inventoryItem.findFirst({
      where: {
        sku: discrepancy.sku,
        siteId: discrepancy.siteId,
        binLocation: discrepancy.binLocation,
      },
    });

    if (inventory) {
      const adjustment = discrepancy.actualQuantity - discrepancy.expectedQuantity;

      await prisma.inventoryItem.update({
        where: { id: inventory.id },
        data: {
          quantityTotal: { increment: adjustment },
          quantityAvailable: { increment: adjustment },
          lastCountedAt: new Date(),
        },
      });

      // Create inventory transaction
      await prisma.inventoryTransaction.create({
        data: {
          sku: discrepancy.sku,
          quantity: Math.abs(adjustment),
          binLocation: discrepancy.binLocation,
          operationType: adjustment > 0 ? 'ADJUSTMENT_IN' : 'ADJUSTMENT_OUT',
          operatorId: resolvedBy,
          siteId: discrepancy.siteId,
          reason: `Discrepancy resolution: ${discrepancyId}`,
        },
      });
    }
  }

  // Update discrepancy status
  const updated = await prisma.discrepancy.update({
    where: { id: discrepancyId },
    data: {
      status: 'RESOLVED',
      resolvedBy,
      resolvedAt: new Date(),
      resolution,
    },
  });

  logger.info(
    `Discrepancy resolved: ${discrepancyId} by ${resolvedBy} - Adjusted: ${adjustInventory}`
  );

  return {
    success: true,
    discrepancy: updated,
  };
}

/**
 * Close discrepancy without resolution
 */
export async function closeDiscrepancy(
  discrepancyId,
  closedBy,
  notes
) {
  const discrepancy = await prisma.discrepancy.findUnique({
    where: { id: discrepancyId },
  });

  if (!discrepancy) {
    throw new Error('Discrepancy not found');
  }

  const updated = await prisma.discrepancy.update({
    where: { id: discrepancyId },
    data: {
      status: 'CLOSED',
      resolvedBy: closedBy,
      resolvedAt: new Date(),
      resolution: notes,
    },
  });

  logger.info(`Discrepancy closed: ${discrepancyId} by ${closedBy}`);

  return {
    success: true,
    discrepancy: updated,
  };
}

/**
 * Generate cycle count for problematic items
 */
export async function generateCycleCount(siteId, generatedBy) {
  // Find items with recent discrepancies
  const problemItems = await prisma.discrepancy.groupBy({
    by: ['sku', 'binLocation'],
    where: {
      siteId,
      createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
    },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: 20,
  });

  // Create stock take
  const stockTake = await prisma.stockTake.create({
    data: {
      siteId,
      createdBy: generatedBy,
      status: 'PENDING',
      type: 'CYCLE_COUNT',
      reason: 'Generated from discrepancy analysis',
      stockTakeItems: {
        create: problemItems.map(item => ({
          sku: item.sku,
          binLocation: item.binLocation,
          expectedQuantity: 0, // Will be updated when counting starts
          actualQuantity: 0,
          status: 'PENDING',
        })),
      },
    },
    include: {
      stockTakeItems: true,
    },
  });

  logger.info(
    `Cycle count generated: ${stockTake.id} - ${problemItems.length} items`
  );

  return {
    success: true,
    stockTake,
  };
}

/**
 * Get discrepancy statistics
 */
export async function getDiscrepancyStats(siteId, startDate, endDate) {
  const where = {
    siteId,
  };

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  const [
    total,
    open,
    investigating,
    resolved,
    closed,
    byRootCause,
    bySku,
  ] = await Promise.all([
    prisma.discrepancy.count({ where }),
    prisma.discrepancy.count({ where: { ...where, status: 'OPEN' } }),
    prisma.discrepancy.count({ where: { ...where, status: 'INVESTIGATING' } }),
    prisma.discrepancy.count({ where: { ...where, status: 'RESOLVED' } }),
    prisma.discrepancy.count({ where: { ...where, status: 'CLOSED' } }),
    prisma.discrepancy.groupBy({
      by: ['rootCause'],
      where: { ...where, rootCause: { not: null } },
      _count: { id: true },
    }),
    prisma.discrepancy.groupBy({
      by: ['sku'],
      where,
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    }),
  ]);

  // Calculate total variance
  const totalVariance = await prisma.discrepancy.aggregate({
    where,
    _sum: { variance: true },
  });

  return {
    total,
    open,
    investigating,
    resolved,
    closed,
    totalVariance: totalVariance._sum.variance || 0,
    byRootCause: byRootCause.map(item => ({
      cause: item.rootCause,
      count: item._count.id,
    })),
    problemItems: bySku.map(item => ({
      sku: item.sku,
      count: item._count.id,
    })),
  };
}

/**
 * Get discrepancies by status
 */
export async function getDiscrepanciesByStatus(siteId, status) {
  const where = { siteId };
  if (status && status !== 'ALL') {
    where.status = status;
  }

  const discrepancies = await prisma.discrepancy.findMany({
    where,
    include: {
      site: { select: { name: true } },
      reportedByUser: { select: { name: true } },
      order: { select: { orderNumber: true } },
      transfer: { select: { id: true, status: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return discrepancies;
}

/**
 * Sync inventory from actual count
 * Auto-detects discrepancies
 */
export async function syncInventoryFromCount(
  sku,
  binLocation,
  siteId,
  actualQuantity,
  countedBy
) {
  const inventory = await prisma.inventoryItem.findFirst({
    where: {
      sku,
      binLocation,
      siteId,
    },
  });

  if (!inventory) {
    // Create new inventory item
    const newInventory = await prisma.inventoryItem.create({
      data: {
        sku,
        siteId,
        binLocation,
        quantityTotal: actualQuantity,
        quantityAvailable: actualQuantity,
        quantityReserved: 0,
        lastCountedAt: new Date(),
      },
    });

    return {
      success: true,
      inventory: newInventory,
      action: 'CREATED',
    };
  }

  const expectedQuantity = inventory.quantityAvailable;

  // Detect discrepancy
  const detection = await detectDiscrepancy(
    sku,
    expectedQuantity,
    actualQuantity,
    binLocation,
    siteId,
    countedBy,
    'INVENTORY_SYNC'
  );

  // Update inventory
  const adjustment = actualQuantity - expectedQuantity;
  const updatedInventory = await prisma.inventoryItem.update({
    where: { id: inventory.id },
    data: {
      quantityTotal: { increment: adjustment },
      quantityAvailable: { increment: adjustment },
      lastCountedAt: new Date(),
    },
  });

  // Create inventory transaction
  await prisma.inventoryTransaction.create({
    data: {
      sku,
      quantity: Math.abs(adjustment),
      binLocation,
      operationType: adjustment > 0 ? 'ADJUSTMENT_IN' : 'ADJUSTMENT_OUT',
      operatorId: countedBy,
      siteId,
      reason: 'Inventory sync from count',
    },
  });

  logger.info(
    `Inventory synced: ${sku} at ${binLocation} - Expected: ${expectedQuantity}, Actual: ${actualQuantity}`
  );

  return {
    success: true,
    inventory: updatedInventory,
    adjustment,
    discrepancyDetected: detection.discrepancyDetected,
    discrepancy: detection.discrepancy || null,
  };
}

// Export service
export const discrepancyService = {
  createDiscrepancy,
  detectDiscrepancy,
  investigateDiscrepancy,
  resolveDiscrepancy,
  closeDiscrepancy,
  generateCycleCount,
  getDiscrepancyStats,
  getDiscrepanciesByStatus,
  syncInventoryFromCount,
};
