import prisma from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * Get all stock takes
 * GET /api/stock-takes
 * Requires: All authenticated users
 */
export const getAllStockTakes = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, status, siteId } = req.query;
    const skip = (page - 1) * limit;

    const where = {
      companyId: req.user.companyId,
    };

    // Filter by site if user is not ADMIN
    if (req.user.role !== 'ADMIN' && req.user.siteId) {
      where.siteId = req.user.siteId;
    } else if (siteId) {
      where.siteId = siteId;
    }

    if (status) {
      where.status = status;
    }

    const [stockTakes, total] = await Promise.all([
      prisma.stockTake.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                  barcode: true,
                },
              },
            },
          },
        },
      }),
      prisma.stockTake.count({ where }),
    ]);

    // Calculate variance for each item
    const stockTakesWithVariance = stockTakes.map(st => ({
      ...st,
      items: st.items.map(item => ({
        ...item,
        variance: item.actualQty !== null ? item.actualQty - item.expectedQty : null,
      })),
    }));

    res.json({
      success: true,
      data: stockTakesWithVariance,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Error fetching stock takes:', error);
    next(error);
  }
};

/**
 * Get single stock take by ID
 * GET /api/stock-takes/:id
 */
export const getStockTakeById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const where = {
      id,
      companyId: req.user.companyId,
    };

    // Non-admin users can only access stock takes at their site
    if (req.user.role !== 'ADMIN' && req.user.siteId) {
      where.siteId = req.user.siteId;
    }

    const stockTake = await prisma.stockTake.findFirst({
      where,
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                barcode: true,
                price: true,
              },
            },
          },
        },
      },
    });

    if (!stockTake) {
      return res.status(404).json({
        success: false,
        error: 'NotFound',
        message: 'Stock take not found',
      });
    }

    // Calculate variance for each item
    const stockTakeWithVariance = {
      ...stockTake,
      items: stockTake.items.map(item => ({
        ...item,
        variance: item.actualQty !== null ? item.actualQty - item.expectedQty : null,
      })),
    };

    res.json({
      success: true,
      data: stockTakeWithVariance,
    });
  } catch (error) {
    logger.error('Error fetching stock take:', error);
    next(error);
  }
};

/**
 * Create new stock take
 * POST /api/stock-takes
 * Requires: ADMIN/MANAGER
 */
export const createStockTake = async (req, res, next) => {
  try {
    const { name, scheduledFor, siteId, notes } = req.body;

    // Verify site belongs to company
    const site = await prisma.site.findFirst({
      where: {
        id: siteId,
        companyId: req.user.companyId,
      },
    });

    if (!site) {
      return res.status(400).json({
        success: false,
        error: 'InvalidSite',
        message: 'Site not found or does not belong to your company',
      });
    }

    const stockTake = await prisma.stockTake.create({
      data: {
        name,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        siteId,
        notes,
        companyId: req.user.companyId,
        createdBy: req.user.id,
      },
    });

    logger.info(`Stock take created: ${stockTake.id} (${name}) by ${req.user.email}`);

    res.status(201).json({
      success: true,
      data: stockTake,
      message: 'Stock take created successfully',
    });
  } catch (error) {
    logger.error('Error creating stock take:', error);
    next(error);
  }
};

/**
 * Update stock take
 * PUT /api/stock-takes/:id
 * Requires: ADMIN/MANAGER
 */
export const updateStockTake = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, scheduledFor, notes } = req.body;

    // Check if stock take exists and belongs to company
    const existingStockTake = await prisma.stockTake.findFirst({
      where: {
        id,
        companyId: req.user.companyId,
      },
    });

    if (!existingStockTake) {
      return res.status(404).json({
        success: false,
        error: 'NotFound',
        message: 'Stock take not found',
      });
    }

    if (existingStockTake.status === 'COMPLETED') {
      return res.status(400).json({
        success: false,
        error: 'CannotUpdate',
        message: 'Cannot update a completed stock take',
      });
    }

    const stockTake = await prisma.stockTake.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(scheduledFor !== undefined && { scheduledFor: scheduledFor ? new Date(scheduledFor) : null }),
        ...(notes !== undefined && { notes }),
      },
    });

    logger.info(`Stock take updated: ${id} by ${req.user.email}`);

    res.json({
      success: true,
      data: stockTake,
      message: 'Stock take updated successfully',
    });
  } catch (error) {
    logger.error('Error updating stock take:', error);
    next(error);
  }
};

/**
 * Add or update stock take item
 * POST /api/stock-takes/:id/items
 * Requires: ADMIN/MANAGER
 */
export const updateStockTakeItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { productId, binCode, expectedQty, actualQty, notes } = req.body;

    // Verify stock take exists and belongs to company
    const stockTake = await prisma.stockTake.findFirst({
      where: {
        id,
        companyId: req.user.companyId,
      },
    });

    if (!stockTake) {
      return res.status(404).json({
        success: false,
        error: 'NotFound',
        message: 'Stock take not found',
      });
    }

    if (stockTake.status === 'COMPLETED') {
      return res.status(400).json({
        success: false,
        error: 'CannotUpdate',
        message: 'Cannot add items to a completed stock take',
      });
    }

    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { sku: true },
    });

    if (!product) {
      return res.status(400).json({
        success: false,
        error: 'InvalidProduct',
        message: 'Product not found',
      });
    }

    // Check if item already exists
    const existingItem = await prisma.stockTakeItem.findFirst({
      where: {
        stockTakeId: id,
        productId,
      },
    });

    let stockTakeItem;
    if (existingItem) {
      // Update existing item
      stockTakeItem = await prisma.stockTakeItem.update({
        where: { id: existingItem.id },
        data: {
          ...(binCode && { binCode }),
          ...(expectedQty !== undefined && { expectedQty }),
          ...(actualQty !== undefined && { actualQty }),
          ...(notes !== undefined && { notes }),
        },
      });
    } else {
      // Create new item
      stockTakeItem = await prisma.stockTakeItem.create({
        data: {
          stockTakeId: id,
          productId,
          sku: product.sku,
          binCode,
          expectedQty,
          actualQty,
          notes,
        },
      });
    }

    // Return with calculated variance
    const itemWithVariance = {
      ...stockTakeItem,
      variance: stockTakeItem.actualQty !== null ? stockTakeItem.actualQty - stockTakeItem.expectedQty : null,
    };

    logger.info(`Stock take item updated: ${itemWithVariance.id} for stock take ${id} by ${req.user.email}`);

    res.json({
      success: true,
      data: itemWithVariance,
      message: 'Stock take item updated successfully',
    });
  } catch (error) {
    logger.error('Error updating stock take item:', error);
    next(error);
  }
};

/**
 * Submit stock take for approval
 * POST /api/stock-takes/:id/submit
 * Requires: ADMIN/MANAGER
 */
export const submitStockTake = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if stock take exists and belongs to company
    const stockTake = await prisma.stockTake.findFirst({
      where: {
        id,
        companyId: req.user.companyId,
      },
      include: {
        items: true,
      },
    });

    if (!stockTake) {
      return res.status(404).json({
        success: false,
        error: 'NotFound',
        message: 'Stock take not found',
      });
    }

    if (stockTake.status === 'COMPLETED') {
      return res.status(400).json({
        success: false,
        error: 'AlreadyCompleted',
        message: 'Stock take has already been completed',
      });
    }

    if (stockTake.items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'NoItems',
        message: 'Cannot submit stock take with no items',
      });
    }

    // Check if all items have actual quantities
    const incompleteItems = stockTake.items.filter(item => item.actualQty === null);
    if (incompleteItems.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'IncompleteCounts',
        message: 'All items must have actual counts before submitting',
      });
    }

    const updatedStockTake = await prisma.stockTake.update({
      where: { id },
      data: {
        status: 'IN_PROGRESS',
        startedAt: new Date(),
      },
    });

    logger.info(`Stock take submitted: ${id} by ${req.user.email}`);

    res.json({
      success: true,
      data: updatedStockTake,
      message: 'Stock take submitted successfully',
    });
  } catch (error) {
    logger.error('Error submitting stock take:', error);
    next(error);
  }
};

/**
 * Approve stock take and adjust inventory
 * POST /api/stock-takes/:id/approve
 * Requires: ADMIN/MANAGER only
 */
export const approveStockTake = async (req, res, next) => {
  try {
    // Verify user has proper authorization
    if (req.user.role !== 'ADMIN' && req.user.role !== 'MANAGER') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Only Admins and Managers can approve stock takes',
      });
    }

    const { id } = req.params;

    // Check if stock take exists and belongs to company
    const stockTake = await prisma.stockTake.findFirst({
      where: {
        id,
        companyId: req.user.companyId,
      },
      include: {
        items: true,
      },
    });

    if (!stockTake) {
      return res.status(404).json({
        success: false,
        error: 'NotFound',
        message: 'Stock take not found',
      });
    }

    if (stockTake.status === 'COMPLETED') {
      return res.status(400).json({
        success: false,
        error: 'AlreadyCompleted',
        message: 'Stock take has already been approved',
      });
    }

    if (stockTake.status === 'PENDING') {
      return res.status(400).json({
        success: false,
        error: 'NotSubmitted',
        message: 'Stock take must be submitted before approval',
      });
    }

    // Adjust inventory based on stock take
    const adjustments = [];
    for (const item of stockTake.items) {
      if (item.actualQty === null) {
        continue;
      }

      const variance = item.actualQty - item.expectedQty;
      
      if (variance !== 0) {
        // Find or create inventory item
        const existingInventory = await prisma.inventoryItem.findFirst({
          where: {
            productId: item.productId,
            binId: item.binCode,
          },
        });

        if (existingInventory) {
          const newQuantity = existingInventory.quantity + variance;
          if (newQuantity < 0) {
            return res.status(400).json({
              success: false,
              error: 'InvalidAdjustment',
              message: `Cannot adjust ${item.sku} below zero`,
            });
          }

          await prisma.inventoryItem.update({
            where: { id: existingInventory.id },
            data: {
              quantity: newQuantity,
            },
          });

          adjustments.push({
            sku: item.sku,
            binCode: item.binCode,
            previousQty: existingInventory.quantity,
            adjustment: variance,
            newQty: newQuantity,
          });
        } else {
          if (item.actualQty < 0) {
            return res.status(400).json({
              success: false,
              error: 'InvalidAdjustment',
              message: `Cannot create negative inventory for ${item.sku}`,
            });
          }

          await prisma.inventoryItem.create({
            data: {
              productId: item.productId,
              binId: item.binCode,
              quantity: item.actualQty,
            },
          });

          adjustments.push({
            sku: item.sku,
            binCode: item.binCode,
            previousQty: 0,
            adjustment: item.actualQty,
            newQty: item.actualQty,
          });
        }
      }
    }

    // Mark stock take as completed
    const completedStockTake = await prisma.stockTake.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        approvedBy: req.user.id,
        approvedAt: new Date(),
      },
    });

    logger.info(`Stock take approved: ${id} with ${adjustments.length} adjustments by ${req.user.email}`);

    res.json({
      success: true,
      data: {
        stockTake: completedStockTake,
        adjustments,
      },
      message: 'Stock take approved and inventory adjusted successfully',
    });
  } catch (error) {
    logger.error('Error approving stock take:', error);
    next(error);
  }
};

/**
 * Delete stock take
 * DELETE /api/stock-takes/:id
 * Requires: ADMIN only
 */
export const deleteStockTake = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if stock take exists and belongs to company
    const existingStockTake = await prisma.stockTake.findFirst({
      where: {
        id,
        companyId: req.user.companyId,
      },
    });

    if (!existingStockTake) {
      return res.status(404).json({
        success: false,
        error: 'NotFound',
        message: 'Stock take not found',
      });
    }

    // Prevent deletion of completed stock takes
    if (existingStockTake.status === 'COMPLETED') {
      return res.status(400).json({
        success: false,
        error: 'CannotDelete',
        message: 'Cannot delete a completed stock take. It has already adjusted inventory.',
      });
    }

    await prisma.stockTake.delete({
      where: { id },
    });

    logger.info(`Stock take deleted: ${id} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Stock take deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting stock take:', error);
    next(error);
  }
};
