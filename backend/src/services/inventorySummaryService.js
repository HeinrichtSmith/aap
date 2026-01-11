/**
 * INVENTORY SUMMARY SERVICE
 * 
 * Context bloat solution with intelligent data summarization.
 * 5-line inventory health summary, zone-level aggregation, actionable insights.
 * 
 * Features:
 * - 5-line inventory health summary
 * - Zone-level aggregation
 * - Velocity-based grouping
 * - Actionable insights generation
 * - Health score calculation
 */

import prisma from '../config/database.js';
import logger from '../utils/logger.js';

const LOW_STOCK_THRESHOLD = 10;
const HIGH_UTILIZATION_THRESHOLD = 0.85;

/**
 * Summarize inventory health
 * Returns 5-line summary with health score
 */
export async function summarizeInventoryHealth(where) {
  const [
    totalProducts,
    lowStockItems,
    outOfStockItems,
    pendingDiscrepancies,
    totalInventory,
    totalAvailable,
    totalReserved,
  ] = await Promise.all([
    prisma.inventoryItem.count({ where }),
    prisma.inventoryItem.count({
      where: { ...where, quantityAvailable: { lt: LOW_STOCK_THRESHOLD } },
    }),
    prisma.inventoryItem.count({
      where: { ...where, quantityAvailable: 0 },
    }),
    prisma.discrepancy.count({
      where: {
        ...where,
        status: { in: ['OPEN', 'INVESTIGATING'] },
      },
    }),
    prisma.inventoryItem.aggregate({
      where,
      _sum: { quantityTotal: true, quantityAvailable: true, quantityReserved: true },
    }),
  ]);

  const total = totalInventory._sum.quantityTotal || 0;
  const available = totalAvailable._sum.quantityAvailable || 0;
  const reserved = totalReserved._sum.quantityReserved || 0;

  // Calculate utilization rate
  const utilizationRate = total > 0 ? reserved / total : 0;

  // Check for blocked aisles (inventory in BLOCKED status)
  const blockedAisles = await prisma.inventoryItem.findMany({
    where: { ...where, status: 'BLOCKED' },
    select: { binLocation: true },
    distinct: ['binLocation'],
  });

  // Calculate health score (0-100)
  const healthScore = calculateHealthScore({
    outOfStockCount: outOfStockItems,
    pendingDiscrepancies,
    utilizationRate,
    blockedAisles: blockedAisles.length,
  });

  // Create 5-line summary
  const summary = `${outOfStockItems} stockouts, ${blockedAisles.length} blocked aisles, ${pendingDiscrepancies} discrepancies pending`;

  return {
    totalProducts,
    lowStockCount: lowStockItems,
    outOfStockCount: outOfStockItems,
    pendingDiscrepancies,
    blockedAisles: blockedAisles.length,
    utilizationRate: Math.round(utilizationRate * 100) / 100,
    totalQuantity: total,
    availableQuantity: available,
    reservedQuantity: reserved,
    summary,
    healthScore,
  };
}

/**
 * Calculate inventory health score (0-100)
 */
function calculateHealthScore(metrics) {
  let score = 100;

  // Penalize stockouts (-10 each)
  score -= Math.min(metrics.outOfStockCount * 10, 30);

  // Penalize pending discrepancies (-5 each)
  score -= Math.min(metrics.pendingDiscrepancies * 5, 20);

  // Penalize high utilization (>85%) (-1 for each 5% over)
  if (metrics.utilizationRate > HIGH_UTILIZATION_THRESHOLD) {
    const overThreshold = (metrics.utilizationRate - HIGH_UTILIZATION_THRESHOLD) * 100;
    score -= Math.min(overThreshold / 5, 15);
  }

  // Penalize blocked aisles (-5 each)
  score -= Math.min(metrics.blockedAisles * 5, 15);

  return Math.max(0, Math.round(score));
}

/**
 * Summarize by velocity groups
 */
export async function summarizeVelocityGroups(where) {
  const inventory = await prisma.inventoryItem.findMany({
    where,
    include: {
      product: true,
    },
  });

  // Calculate pick count for each SKU (from transactions)
  const skuTransactions = await prisma.inventoryTransaction.groupBy({
    by: ['sku'],
    where: {
      ...where,
      operationType: { in: ['PICK', 'SALE'] },
      createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
    },
    _sum: { quantity: true },
  });

  const skuPickCounts = {};
  skuTransactions.forEach(t => {
    skuPickCounts[t.sku] = t._sum.quantity || 0;
  });

  // Group by velocity
  const groups = {
    A: { count: 0, quantity: 0, items: [] }, // Fast movers (top 20%)
    B: { count: 0, quantity: 0, items: [] }, // Medium movers
    C: { count: 0, quantity: 0, items: [] }, // Slow movers
    D: { count: 0, quantity: 0, items: [] }, // Dead stock
  };

  // Sort by pick count
  const sortedInventory = inventory.map(item => ({
    ...item,
    pickCount: skuPickCounts[item.sku] || 0,
  })).sort((a, b) => b.pickCount - a.pickCount);

  // Assign to groups (top 20% = A, next 30% = B, next 30% = C, rest = D)
  const totalCount = sortedInventory.length;
  sortedInventory.forEach((item, index) => {
    const percentile = index / totalCount;
    let group;

    if (percentile < 0.2) {
      group = 'A';
    } else if (percentile < 0.5) {
      group = 'B';
    } else if (percentile < 0.8) {
      group = 'C';
    } else {
      group = 'D';
    }

    groups[group].count++;
    groups[group].quantity += item.quantityAvailable;
    groups[group].items.push({
      sku: item.sku,
      name: item.product?.name,
      quantity: item.quantityAvailable,
      pickCount: item.pickCount,
    });
  });

  return {
    total: totalCount,
    groups: {
      A: {
        name: 'Fast Movers (Top 20%)',
        count: groups.A.count,
        quantity: groups.A.quantity,
        items: groups.A.items.slice(0, 10), // Top 10
      },
      B: {
        name: 'Medium Movers (Next 30%)',
        count: groups.B.count,
        quantity: groups.B.quantity,
        items: groups.B.items.slice(0, 10),
      },
      C: {
        name: 'Slow Movers (Next 30%)',
        count: groups.C.count,
        quantity: groups.C.quantity,
        items: groups.C.items.slice(0, 10),
      },
      D: {
        name: 'Dead Stock (Bottom 20%)',
        count: groups.D.count,
        quantity: groups.D.quantity,
        items: groups.D.items.slice(0, 10),
      },
    },
  };
}

/**
 * Generate actionable insights
 */
export async function getActionableInsights(limit, where) {
  const insights = [];

  // Insight 1: Stockouts
  const outOfStock = await prisma.inventoryItem.findMany({
    where: { ...where, quantityAvailable: 0 },
    take: 5,
    include: { product: true },
  });

  if (outOfStock.length > 0) {
    insights.push({
      type: 'CRITICAL',
      category: 'STOCKOUT',
      message: `${outOfStock.length} items out of stock`,
      items: outOfStock.map(item => ({
        sku: item.sku,
        name: item.product?.name,
        binLocation: item.binLocation,
      })),
      action: 'Restock immediately or create purchase orders',
    });
  }

  // Insight 2: Low stock
  const lowStock = await prisma.inventoryItem.findMany({
    where: { ...where, quantityAvailable: { lt: LOW_STOCK_THRESHOLD, gt: 0 } },
    take: 5,
    include: { product: true },
  });

  if (lowStock.length > 0) {
    insights.push({
      type: 'WARNING',
      category: 'LOW_STOCK',
      message: `${lowStock.length} items running low`,
      items: lowStock.map(item => ({
        sku: item.sku,
        name: item.product?.name,
        quantity: item.quantityAvailable,
      })),
      action: 'Review reorder points and create purchase orders',
    });
  }

  // Insight 3: High utilization
  const totalStats = await prisma.inventoryItem.aggregate({
    where,
    _sum: { quantityTotal: true, quantityReserved: true },
  });

  const utilizationRate =
    (totalStats._sum.quantityReserved || 0) / (totalStats._sum.quantityTotal || 1);

  if (utilizationRate > HIGH_UTILIZATION_THRESHOLD) {
    insights.push({
      type: 'WARNING',
      category: 'HIGH_UTILIZATION',
      message: `Warehouse utilization at ${(utilizationRate * 100).toFixed(1)}%`,
      action: 'Consider expanding capacity or prioritizing order fulfillment',
    });
  }

  // Insight 4: Pending discrepancies
  const pendingDiscrepancies = await prisma.discrepancy.findMany({
    where: {
      ...where,
      status: { in: ['OPEN', 'INVESTIGATING'] },
    },
    take: 5,
    include: {
      product: true,
      site: { select: { name: true } },
    },
  });

  if (pendingDiscrepancies.length > 0) {
    insights.push({
      type: 'WARNING',
      category: 'DISCREPANCY',
      message: `${pendingDiscrepancies.length} discrepancies pending resolution`,
      items: pendingDiscrepancies.map(d => ({
        id: d.id,
        sku: d.sku,
        variance: d.variance,
        status: d.status,
      })),
      action: 'Investigate and resolve discrepancies to maintain accuracy',
    });
  }

  // Insight 5: Overstocked items (high quantity, low pick rate)
  const overstocked = await prisma.inventoryItem.findMany({
    where: {
      ...where,
      quantityTotal: { gt: 100 },
    },
    take: 5,
    include: { product: true },
    orderBy: { quantityTotal: 'desc' },
  });

  if (overstocked.length > 0) {
    insights.push({
      type: 'INFO',
      category: 'OVERSTOCK',
      message: `${overstocked.length} items may be overstocked`,
      items: overstocked.map(item => ({
        sku: item.sku,
        name: item.product?.name,
        quantity: item.quantityTotal,
      })),
      action: 'Review slow-moving inventory for potential clearance or reallocation',
    });
  }

  // Insight 6: Blocked locations
  const blocked = await prisma.inventoryItem.findMany({
    where: { ...where, status: 'BLOCKED' },
    take: 5,
    include: { product: true },
  });

  if (blocked.length > 0) {
    insights.push({
      type: 'WARNING',
      category: 'BLOCKED',
      message: `${blocked.length} items in blocked status`,
      items: blocked.map(item => ({
        sku: item.sku,
        binLocation: item.binLocation,
        quantity: item.quantityTotal,
      })),
      action: 'Unblock locations to free up inventory',
    });
  }

  // Sort insights by type (CRITICAL first)
  insights.sort((a, b) => {
    const typeOrder = { CRITICAL: 0, WARNING: 1, INFO: 2 };
    return typeOrder[a.type] - typeOrder[b.type];
  });

  return insights.slice(0, limit);
}

/**
 * Get zone-level inventory summary
 */
export async function summarizeByZone(where) {
  const inventory = await prisma.inventoryItem.findMany({
    where,
  });

  const zoneMap = {};

  inventory.forEach(item => {
    const zone = item.binLocation?.split('-')[0] || 'UNKNOWN';
    if (!zoneMap[zone]) {
      zoneMap[zone] = {
        zone,
        itemCount: 0,
        totalQuantity: 0,
        availableQuantity: 0,
        reservedQuantity: 0,
      };
    }

    zoneMap[zone].itemCount++;
    zoneMap[zone].totalQuantity += item.quantityTotal;
    zoneMap[zone].availableQuantity += item.quantityAvailable;
    zoneMap[zone].reservedQuantity += item.quantityReserved;
  });

  const zones = Object.values(zoneMap).sort((a, b) => a.zone.localeCompare(b.zone));

  return zones;
}

// Export service
export const inventorySummaryService = {
  summarizeInventoryHealth,
  summarizeVelocityGroups,
  getActionableInsights,
  summarizeByZone,
};
