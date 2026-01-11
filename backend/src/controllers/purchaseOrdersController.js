import prisma from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * Get all purchase orders
 * GET /api/purchase-orders
 * Requires: All authenticated users
 */
export const getAllPurchaseOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, status, supplierName } = req.query;
    const skip = (page - 1) * limit;

    const where = {
      companyId: req.user.companyId,
    };

    // Filter by site if user is not ADMIN
    if (req.user.role !== 'ADMIN' && req.user.siteId) {
      where.siteId = req.user.siteId;
    }

    if (status) {
      where.status = status;
    }

    if (supplierName) {
      where.supplierName = {
        contains: supplierName,
        mode: 'insensitive',
      };
    }

    const [purchaseOrders, total] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          site: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                },
              },
            },
          },
        },
      }),
      prisma.purchaseOrder.count({ where }),
    ]);

    res.json({
      success: true,
      data: purchaseOrders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Error fetching purchase orders:', error);
    next(error);
  }
};

/**
 * Get single purchase order by ID
 * GET /api/purchase-orders/:id
 */
export const getPurchaseOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const where = {
      id,
      companyId: req.user.companyId,
    };

    // Non-admin users can only access POs at their site
    if (req.user.role !== 'ADMIN' && req.user.siteId) {
      where.siteId = req.user.siteId;
    }

    const purchaseOrder = await prisma.purchaseOrder.findFirst({
      where,
      include: {
        site: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                barcode: true,
                unitCost: true,
              },
            },
          },
        },
      },
    });

    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        error: 'NotFound',
        message: 'Purchase order not found',
      });
    }

    res.json({
      success: true,
      data: purchaseOrder,
    });
  } catch (error) {
    logger.error('Error fetching purchase order:', error);
    next(error);
  }
};

/**
 * Create new purchase order
 * POST /api/purchase-orders
 * Requires: ADMIN/MANAGER/RECEIVER
 */
export const createPurchaseOrder = async (req, res, next) => {
  try {
    const { 
      id, 
      supplierName, 
      supplierEmail, 
      supplierPhone, 
      siteId, 
      expectedDate,
      items 
    } = req.body;

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

    // Create purchase order with items
    const purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        id,
        supplierName,
        supplierEmail,
        supplierPhone,
        siteId,
        expectedDate: expectedDate ? new Date(expectedDate) : null,
        companyId: req.user.companyId,
        items: {
          create: items.map(item => ({
            productId: item.productId,
            orderedQty: item.orderedQty,
            receivedQty: 0,
          })),
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    logger.info(`Purchase order created: ${purchaseOrder.id} (${supplierName}) by ${req.user.email}`);

    res.status(201).json({
      success: true,
      data: purchaseOrder,
      message: 'Purchase order created successfully',
    });
  } catch (error) {
    logger.error('Error creating purchase order:', error);
    
    if (error.code === 'P2002') {
      return res.status(409).json({
        success: false,
        error: 'DuplicatePO',
        message: 'A purchase order with this ID already exists',
      });
    }
    
    next(error);
  }
};

/**
 * Update purchase order
 * PUT /api/purchase-orders/:id
 * Requires: ADMIN/MANAGER/RECEIVER
 */
export const updatePurchaseOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { supplierName, supplierEmail, supplierPhone, expectedDate, status } = req.body;

    // Check if PO exists and belongs to company
    const existingPO = await prisma.purchaseOrder.findFirst({
      where: {
        id,
        companyId: req.user.companyId,
      },
    });

    if (!existingPO) {
      return res.status(404).json({
        success: false,
        error: 'NotFound',
        message: 'Purchase order not found',
      });
    }

    const purchaseOrder = await prisma.purchaseOrder.update({
      where: { id },
      data: {
        ...(supplierName && { supplierName }),
        ...(supplierEmail !== undefined && { supplierEmail }),
        ...(supplierPhone !== undefined && { supplierPhone }),
        ...(expectedDate !== undefined && { expectedDate: expectedDate ? new Date(expectedDate) : null }),
        ...(status && { status }),
      },
    });

    logger.info(`Purchase order updated: ${id} by ${req.user.email}`);

    res.json({
      success: true,
      data: purchaseOrder,
      message: 'Purchase order updated successfully',
    });
  } catch (error) {
    logger.error('Error updating purchase order:', error);
    next(error);
  }
};

/**
 * Receive items from purchase order
 * POST /api/purchase-orders/:id/receive
 * Requires: ADMIN/MANAGER/RECEIVER
 */
export const receivePurchaseOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { items, binId } = req.body;

    // Check if PO exists and belongs to company
    const purchaseOrder = await prisma.purchaseOrder.findFirst({
      where: {
        id,
        companyId: req.user.companyId,
      },
      include: {
        items: true,
      },
    });

    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        error: 'NotFound',
        message: 'Purchase order not found',
      });
    }

    if (purchaseOrder.status === 'RECEIVED') {
      return res.status(400).json({
        success: false,
        error: 'AlreadyReceived',
        message: 'Purchase order has already been fully received',
      });
    }

    // Process each received item
    const receivedItems = [];
    for (const receivedItem of items) {
      const poItem = purchaseOrder.items.find(item => item.id === receivedItem.poItemId);
      
      if (!poItem) {
        continue;
      }

      const qtyReceived = receivedItem.qtyReceived;

      // Update PO item
      await prisma.purchaseOrderItem.update({
        where: { id: poItem.id },
        data: {
          receivedQty: { increment: qtyReceived },
        },
      });

      // Update inventory
      const existingInventory = await prisma.inventory.findFirst({
        where: {
          productId: poItem.productId,
          binId,
        },
      });

      if (existingInventory) {
        await prisma.inventory.update({
          where: { id: existingInventory.id },
          data: {
            quantity: { increment: qtyReceived },
          },
        });
      } else {
        await prisma.inventory.create({
          data: {
            productId: poItem.productId,
            binId,
            quantity: qtyReceived,
            companyId: req.user.companyId,
          },
        });
      }

      receivedItems.push({
        poItemId: poItem.id,
        productId: poItem.productId,
        qtyReceived,
      });
    }

    // Update PO status if all items received
    const updatedPO = await prisma.purchaseOrder.findFirst({
      where: { id },
      include: { items: true },
    });

    const allItemsReceived = updatedPO.items.every(
      item => item.receivedQty >= item.orderedQty
    );

    if (allItemsReceived) {
      await prisma.purchaseOrder.update({
        where: { id },
        data: { status: 'RECEIVED' },
      });
    } else if (updatedPO.items.some(item => item.receivedQty > 0)) {
      await prisma.purchaseOrder.update({
        where: { id },
        data: { status: 'PARTIAL' },
      });
    }

    logger.info(`Purchase order items received: ${id} by ${req.user.email}`);

    res.json({
      success: true,
      data: { receivedItems },
      message: 'Items received successfully',
    });
  } catch (error) {
    logger.error('Error receiving purchase order items:', error);
    next(error);
  }
};

/**
 * Delete purchase order
 * DELETE /api/purchase-orders/:id
 * Requires: ADMIN only
 */
export const deletePurchaseOrder = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if PO exists and belongs to company
    const existingPO = await prisma.purchaseOrder.findFirst({
      where: {
        id,
        companyId: req.user.companyId,
      },
    });

    if (!existingPO) {
      return res.status(404).json({
        success: false,
        error: 'NotFound',
        message: 'Purchase order not found',
      });
    }

    // Prevent deletion if items have been received
    if (existingPO.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        error: 'CannotDelete',
        message: 'Cannot delete purchase order that has been partially or fully received',
      });
    }

    await prisma.purchaseOrder.delete({
      where: { id },
    });

    logger.info(`Purchase order deleted: ${id} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Purchase order deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting purchase order:', error);
    next(error);
  }
};
