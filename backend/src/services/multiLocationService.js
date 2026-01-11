/**
 * MULTI-LOCATION INVENTORY SERVICE
 * 
 * Handles cross-site inventory transfers, multi-site sourcing,
 * and site-level aggregation for multi-warehouse operations.
 */

import prisma from '../config/database.js';
import { stockLockService } from './stockLockService.js';
import logger from '../utils/logger.js';

/**
 * Transfer inventory between sites
 * Creates a transfer request with stock reservation at source site
 */
export async function createTransfer(data) {
  const {
    sku,
    quantity,
    fromSiteId,
    toSiteId,
    requestedBy,
    reason,
    priority = 'NORMAL',
  } = data;

  // Verify both sites exist and belong to same company
  const [fromSite, toSite] = await Promise.all([
    prisma.site.findUnique({ where: { id: fromSiteId } }),
    prisma.site.findUnique({ where: { id: toSiteId } }),
  ]);

  if (!fromSite || !toSite) {
    throw new Error('Invalid source or destination site');
  }

  if (fromSite.companyId !== toSite.companyId) {
    throw new Error('Cannot transfer between different companies');
  }

  // Check inventory availability at source site
  const inventory = await prisma.inventoryItem.findFirst({
    where: {
      sku,
      siteId: fromSiteId,
    },
    include: { product: true },
  });

  if (!inventory) {
    throw new Error(`Inventory item ${sku} not found at source site`);
  }

  if (inventory.quantityAvailable < quantity) {
    throw new Error(
      `Insufficient inventory at source site. Available: ${inventory.quantityAvailable}, Requested: ${quantity}`
    );
  }

  // Lock inventory at source site
  const lockResult = await stockLockService.reserveStock({
    sku,
    quantity,
    binLocation: inventory.binLocation,
    operationType: 'TRANSFER_OUT',
    operatorId: requestedBy,
    transferId: null, // Will be set after transfer creation
  });

  if (!lockResult.success) {
    throw new Error(`Failed to lock inventory: ${lockResult.message}`);
  }

  // Create transfer record
  const transfer = await prisma.inventoryTransfer.create({
    data: {
      sku,
      quantity,
      fromSiteId,
      toSiteId,
      requestedById: requestedBy,
      reason,
      priority: priority.toUpperCase(),
      status: 'PENDING',
      lockId: lockResult.lockId,
    },
    include: {
      fromSite: { select: { id: true, name: true, companyId: true } },
      toSite: { select: { id: true, name: true, companyId: true } },
      requestedBy: { select: { id: true, name: true, email: true } },
      product: true,
    },
  });

  // Update lock with transfer ID
  await prisma.stockLock.update({
    where: { id: lockResult.lockId },
    data: { transferId: transfer.id },
  });

  logger.info(
    `Transfer created: ${transfer.id} - ${quantity}x ${sku} from ${fromSite.name} to ${toSite.name}`
  );

  return {
    success: true,
    transfer,
    lockId: lockResult.lockId,
  };
}

/**
 * Approve transfer request (manager/admin only)
 * Confirms inventory lock and prepares for shipping
 */
export async function approveTransfer(transferId, approvedBy) {
  const transfer = await prisma.inventoryTransfer.findUnique({
    where: { id: transferId },
    include: { fromSite: true, toSite: true },
  });

  if (!transfer) {
    throw new Error('Transfer not found');
  }

  if (transfer.status !== 'PENDING') {
    throw new Error(`Cannot approve transfer in ${transfer.status} status`);
  }

  // Update transfer status
  const updatedTransfer = await prisma.inventoryTransfer.update({
    where: { id: transferId },
    data: {
      status: 'APPROVED',
      approvedById: approvedBy,
      approvedAt: new Date(),
    },
  });

  logger.info(`Transfer approved: ${transferId} by ${approvedBy}`);

  return {
    success: true,
    transfer: updatedTransfer,
  };
}

/**
 * Ship transfer (source site operator)
 * Commits the stock lock and creates outbound inventory movement
 */
export async function shipTransfer(transferId, shippedBy, trackingNumber) {
  const transfer = await prisma.inventoryTransfer.findUnique({
    where: { id: transferId },
    include: { fromSite: true, toSite: true },
  });

  if (!transfer) {
    throw new Error('Transfer not found');
  }

  if (transfer.status !== 'APPROVED') {
    throw new Error(`Cannot ship transfer in ${transfer.status} status`);
  }

  // Commit stock lock (actual deduction from source)
  const commitResult = await stockLockService.commitLock(transfer.lockId, shippedBy);

  if (!commitResult.success) {
    throw new Error(`Failed to commit stock lock: ${commitResult.message}`);
  }

  // Update transfer status
  const updatedTransfer = await prisma.inventoryTransfer.update({
    where: { id: transferId },
    data: {
      status: 'IN_TRANSIT',
      shippedById: shippedBy,
      shippedAt: new Date(),
      trackingNumber,
    },
  });

  logger.info(
    `Transfer shipped: ${transferId} - tracking: ${trackingNumber} by ${shippedBy}`
  );

  return {
    success: true,
    transfer: updatedTransfer,
  };
}

/**
 * Receive transfer (destination site operator)
 * Adds inventory to destination site
 */
export async function receiveTransfer(transferId, receivedBy, actualQuantity, binLocation) {
  const transfer = await prisma.inventoryTransfer.findUnique({
    where: { id: transferId },
    include: { fromSite: true, toSite: true },
  });

  if (!transfer) {
    throw new Error('Transfer not found');
  }

  if (transfer.status !== 'IN_TRANSIT') {
    throw new Error(`Cannot receive transfer in ${transfer.status} status`);
  }

  // Find or create inventory item at destination
  let destinationInventory = await prisma.inventoryItem.findFirst({
    where: {
      sku: transfer.sku,
      siteId: transfer.toSiteId,
    },
  });

  if (!destinationInventory) {
    // Create new inventory item at destination
    destinationInventory = await prisma.inventoryItem.create({
      data: {
        sku: transfer.sku,
        productId: transfer.productId,
        siteId: transfer.toSiteId,
        binLocation: binLocation || 'STAGING',
        quantityTotal: actualQuantity,
        quantityAvailable: actualQuantity,
        quantityReserved: 0,
        lastCountedAt: new Date(),
      },
    });
  } else {
    // Update existing inventory
    destinationInventory = await prisma.inventoryItem.update({
      where: { id: destinationInventory.id },
      data: {
        binLocation: binLocation || destinationInventory.binLocation,
        quantityTotal: { increment: actualQuantity },
        quantityAvailable: { increment: actualQuantity },
        lastCountedAt: new Date(),
      },
    });
  }

  // Create inventory transaction for receipt
  await prisma.inventoryTransaction.create({
    data: {
      sku: transfer.sku,
      quantity: actualQuantity,
      binLocation: binLocation || 'STAGING',
      operationType: 'TRANSFER_IN',
      operatorId: receivedBy,
      siteId: transfer.toSiteId,
      transferId: transfer.id,
      reason: `Transfer received from ${transfer.fromSite.name}`,
    },
  });

  // Handle discrepancy if quantity differs
  let discrepancyId = null;
  if (actualQuantity !== transfer.quantity) {
    const discrepancy = await prisma.discrepancy.create({
      data: {
        sku: transfer.sku,
        expectedQuantity: transfer.quantity,
        actualQuantity: actualQuantity,
        binLocation: binLocation || 'STAGING',
        siteId: transfer.toSiteId,
        reportedBy: receivedBy,
        reason: `Transfer ${transfer.id} quantity variance`,
        status: 'OPEN',
        transferId: transfer.id,
      },
    });
    discrepancyId = discrepancy.id;
    logger.warn(
      `Transfer discrepancy detected: ${transferId} - Expected: ${transfer.quantity}, Received: ${actualQuantity}`
    );
  }

  // Update transfer status
  const updatedTransfer = await prisma.inventoryTransfer.update({
    where: { id: transferId },
    data: {
      status: discrepancyId ? 'RECEIVED_WITH_DISCREPANCY' : 'COMPLETED',
      receivedById: receivedBy,
      receivedAt: new Date(),
      actualQuantity,
      discrepancyId,
    },
  });

  logger.info(
    `Transfer received: ${transferId} - ${actualQuantity}x ${transfer.sku} by ${receivedBy}`
  );

  return {
    success: true,
    transfer: updatedTransfer,
    inventory: destinationInventory,
    discrepancy: discrepancyId ? { created: true, id: discrepancyId } : null,
  };
}

/**
 * Get inventory across all sites
 */
export async function getMultiSiteInventory(companyId, sku) {
  const inventory = await prisma.inventoryItem.findMany({
    where: {
      sku,
      site: { companyId },
    },
    include: {
      site: { select: { id: true, name: true } },
      product: { select: { id: true, name: true, barcode: true } },
    },
  });

  const totalQuantity = inventory.reduce((sum, item) => sum + item.quantityAvailable, 0);

  return {
    sku,
    inventory,
    totalQuantity,
    sitesCount: inventory.length,
    companyTotalAvailable: totalQuantity,
  };
}

/**
 * Find best source site for fulfilling an order
 * Considers: availability, distance, priority
 */
export async function findBestSourceSite(sku, quantity, preferredSiteId) {
  // If preferred site has inventory, use it
  if (preferredSiteId) {
    const preferredInventory = await prisma.inventoryItem.findFirst({
      where: {
        sku,
        siteId: preferredSiteId,
        quantityAvailable: { gte: quantity },
      },
    });

    if (preferredInventory) {
      return {
        siteId: preferredSiteId,
        available: preferredInventory.quantityAvailable,
        source: 'preferred_site',
      };
    }
  }

  // Find all sites with sufficient inventory
  const availableSites = await prisma.inventoryItem.findMany({
    where: {
      sku,
      quantityAvailable: { gte: quantity },
    },
    include: {
      site: { select: { id: true, name: true, isPrimary: true } },
    },
    orderBy: {
      quantityAvailable: 'desc',
    },
  });

  // Prefer primary site if available
  const primarySite = availableSites.find(item => item.site.isPrimary);
  if (primarySite) {
    return {
      siteId: primarySite.siteId,
      available: primarySite.quantityAvailable,
      source: 'primary_site',
    };
  }

  // Return site with most inventory
  if (availableSites.length > 0) {
    const bestSite = availableSites[0];
    return {
      siteId: bestSite.siteId,
      available: bestSite.quantityAvailable,
      source: 'highest_inventory',
    };
  }

  // Check if multiple sites can fulfill order (split shipment)
  const allSites = await prisma.inventoryItem.findMany({
    where: { sku, quantityAvailable: { gt: 0 } },
    include: { site: { select: { id: true, name: true } } },
    orderBy: { quantityAvailable: 'desc' },
  });

  if (allSites.length > 0) {
    return {
      siteId: null, // Indicates split shipment
      available: allSites.reduce((sum, item) => sum + item.quantityAvailable, 0),
      source: 'split_shipment',
      suggestedSplit: allSites.map(item => ({
        siteId: item.siteId,
        siteName: item.site.name,
        available: item.quantityAvailable,
      })),
    };
  }

  throw new Error(`Insufficient inventory across all sites for ${sku}`);
}

/**
 * Get site-level inventory summary
 */
export async function getSiteInventorySummary(siteId) {
  const summary = await prisma.inventoryItem.groupBy({
    by: ['status'],
    where: { siteId },
    _count: { id: true },
    _sum: {
      quantityTotal: true,
      quantityAvailable: true,
      quantityReserved: true,
    },
  });

  return summary.map(group => ({
    status: group.status,
    itemCount: group._count.id,
    totalQuantity: group._sum.quantityTotal || 0,
    availableQuantity: group._sum.quantityAvailable || 0,
    reservedQuantity: group._sum.quantityReserved || 0,
  }));
}

// Export service
export const multiLocationService = {
  createTransfer,
  approveTransfer,
  shipTransfer,
  receiveTransfer,
  getMultiSiteInventory,
  findBestSourceSite,
  getSiteInventorySummary,
};
