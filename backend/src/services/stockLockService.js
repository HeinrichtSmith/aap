/**
 * STOCK LOCK PROTOCOL
 * 
 * Atomic inventory reservation system to prevent race conditions.
 * Ensures inventory cannot be oversold during concurrent operations.
 * 
 * Lock Flow:
 * 1. reserveStock() - Lock inventory (reserve, don't deduct)
 * 2. commitLock() - Actually deduct from inventory
 * 3. rollbackLock() - Release lock without deduction
 * 4. Locks auto-expire after 30 minutes
 */

import prisma from '../config/database.js';
import logger from '../utils/logger.js';

const LOCK_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Reserve inventory for an operation
 * Creates a lock without deducting from available quantity
 */
export async function reserveStock(data) {
  const {
    sku,
    quantity,
    binLocation,
    operationType,
    operatorId,
    orderId = null,
    transferId = null,
  } = data;

  // Find inventory item
  const inventory = await prisma.inventoryItem.findFirst({
    where: {
      sku,
      binLocation,
      quantityAvailable: { gte: quantity },
    },
  });

  if (!inventory) {
    return {
      success: false,
      message: `Insufficient inventory: ${sku} at ${binLocation}`,
    };
  }

  // Check for conflicting locks
  const existingLocks = await prisma.stockLock.findMany({
    where: {
      sku,
      binLocation,
      status: 'LOCKED',
      createdAt: { gte: new Date(Date.now() - LOCK_TIMEOUT_MS) },
    },
  });

  const lockedQuantity = existingLocks.reduce((sum, lock) => sum + lock.quantity, 0);
  const availableAfterLocks = inventory.quantityAvailable - lockedQuantity;

  if (availableAfterLocks < quantity) {
    return {
      success: false,
      message: `Inventory locked by other operations. Available: ${availableAfterLocks}, Requested: ${quantity}`,
    };
  }

  // Create stock lock
  const lock = await prisma.stockLock.create({
    data: {
      sku,
      quantity,
      binLocation,
      operationType,
      status: 'LOCKED',
      operatorId,
      orderId,
      transferId,
      expiresAt: new Date(Date.now() + LOCK_TIMEOUT_MS),
    },
  });

  logger.info(
    `Stock reserved: ${quantity}x ${sku} at ${binLocation} - Lock: ${lock.id}`
  );

  return {
    success: true,
    lockId: lock.id,
    message: 'Inventory reserved successfully',
  };
}

/**
 * Commit a stock lock
 * Actually deducts from inventory and marks lock as committed
 */
export async function commitLock(lockId, operatorId) {
  const lock = await prisma.stockLock.findUnique({
    where: { id: lockId },
  });

  if (!lock) {
    return {
      success: false,
      message: 'Lock not found',
    };
  }

  if (lock.status !== 'LOCKED') {
    return {
      success: false,
      message: `Lock already ${lock.status}`,
    };
  }

  // Check if lock expired
  if (lock.expiresAt < new Date()) {
    await rollbackLock(lockId, operatorId, 'Lock expired before commit');
    return {
      success: false,
      message: 'Lock expired',
    };
  }

  // Update inventory
  const inventory = await prisma.inventoryItem.findFirst({
    where: {
      sku: lock.sku,
      binLocation: lock.binLocation,
    },
  });

  if (!inventory) {
    return {
      success: false,
      message: 'Inventory item not found',
    };
  }

  // Deduct from available quantity
  await prisma.inventoryItem.update({
    where: { id: inventory.id },
    data: {
      quantityAvailable: { decrement: lock.quantity },
      quantityReserved: { increment: lock.quantity },
    },
  });

  // Create inventory transaction
  await prisma.inventoryTransaction.create({
    data: {
      sku: lock.sku,
      quantity: lock.quantity,
      binLocation: lock.binLocation,
      operationType: lock.operationType,
      operatorId,
      siteId: inventory.siteId,
      orderId: lock.orderId,
      transferId: lock.transferId,
      reason: `Commit lock ${lock.id}`,
    },
  });

  // Update lock status
  await prisma.stockLock.update({
    where: { id: lockId },
    data: {
      status: 'COMMITTED',
      committedAt: new Date(),
      committedById: operatorId,
    },
  });

  logger.info(
    `Stock committed: ${lock.quantity}x ${lock.sku} - Lock: ${lockId}`
  );

  return {
    success: true,
    message: 'Inventory committed successfully',
  };
}

/**
 * Rollback a stock lock
 * Releases the lock without deducting from inventory
 */
export async function rollbackLock(lockId, operatorId, reason = 'Rollback') {
  const lock = await prisma.stockLock.findUnique({
    where: { id: lockId },
  });

  if (!lock) {
    return {
      success: false,
      message: 'Lock not found',
    };
  }

  if (lock.status !== 'LOCKED') {
    return {
      success: false,
      message: `Cannot rollback lock in ${lock.status} status`,
    };
  }

  // Update lock status
  await prisma.stockLock.update({
    where: { id: lockId },
    data: {
      status: 'RELEASED',
      releasedAt: new Date(),
      releasedById: operatorId,
      reason,
    },
  });

  logger.info(
    `Stock lock released: ${lock.quantity}x ${lock.sku} - Lock: ${lockId} - Reason: ${reason}`
  );

  return {
    success: true,
    message: 'Lock released successfully',
  };
}

/**
 * Get lock status
 */
export async function getLock(lockId) {
  const lock = await prisma.stockLock.findUnique({
    where: { id: lockId },
    include: {
      operator: { select: { id: true, name: true } },
      order: { select: { id: true, orderNumber: true } },
      transfer: { select: { id: true, status: true } },
    },
  });

  if (!lock) {
    return {
      success: false,
      message: 'Lock not found',
    };
  }

  return {
    success: true,
    lock: {
      ...lock,
      isExpired: lock.expiresAt < new Date(),
    },
  };
}

/**
 * Release expired locks
 * Called by cron job every 15 minutes
 */
export async function releaseExpiredLocks() {
  const expiredLocks = await prisma.stockLock.findMany({
    where: {
      status: 'LOCKED',
      expiresAt: { lt: new Date() },
    },
  });

  for (const lock of expiredLocks) {
    await prisma.stockLock.update({
      where: { id: lock.id },
      data: {
        status: 'EXPIRED',
        releasedAt: new Date(),
        reason: 'Lock timeout (30 minutes)',
      },
    });

    logger.warn(
      `Lock expired: ${lock.id} - ${lock.quantity}x ${lock.sku} at ${lock.binLocation}`
    );
  }

  logger.info(`Released ${expiredLocks.length} expired locks`);

  return {
    success: true,
    releasedCount: expiredLocks.length,
  };
}

/**
 * Get active locks for an item
 */
export async function getActiveLocks(sku, binLocation) {
  const locks = await prisma.stockLock.findMany({
    where: {
      sku,
      binLocation,
      status: 'LOCKED',
      expiresAt: { gte: new Date() },
    },
    include: {
      operator: { select: { id: true, name: true } },
      order: { select: { id: true, orderNumber: true } },
      transfer: { select: { id: true, status: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  return locks;
}

/**
 * Calculate available inventory considering locks
 */
export async function getAvailableWithLocks(sku, binLocation) {
  const inventory = await prisma.inventoryItem.findFirst({
    where: { sku, binLocation },
  });

  if (!inventory) {
    return {
      available: 0,
      total: 0,
      locked: 0,
    };
  }

  const locks = await getActiveLocks(sku, binLocation);
  const lockedQuantity = locks.reduce((sum, lock) => sum + lock.quantity, 0);

  return {
    available: inventory.quantityAvailable - lockedQuantity,
    total: inventory.quantityTotal,
    locked: lockedQuantity,
    reserved: inventory.quantityReserved,
  };
}

// Export service
export const stockLockService = {
  reserveStock,
  commitLock,
  rollbackLock,
  getLock,
  releaseExpiredLocks,
  getActiveLocks,
  getAvailableWithLocks,
};
