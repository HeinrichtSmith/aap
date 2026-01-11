import prisma from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * Get all returns
 * GET /api/returns
 * Requires: All authenticated users
 */
export const getAllReturns = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, status, customerName } = req.query;
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

    if (customerName) {
      where.customerName = {
        contains: customerName,
        mode: 'insensitive',
      };
    }

    const [returns, total] = await Promise.all([
      prisma.return.findMany({
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
          order: {
            select: {
              id: true,
              orderNumber: true,
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
      prisma.return.count({ where }),
    ]);

    res.json({
      success: true,
      data: returns,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Error fetching returns:', error);
    next(error);
  }
};

/**
 * Get single return by ID
 * GET /api/returns/:id
 */
export const getReturnById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const where = {
      id,
      companyId: req.user.companyId,
    };

    // Non-admin users can only access returns at their site
    if (req.user.role !== 'ADMIN' && req.user.siteId) {
      where.siteId = req.user.siteId;
    }

    const returnRecord = await prisma.return.findFirst({
      where,
      include: {
        site: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
            customerName: true,
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

    if (!returnRecord) {
      return res.status(404).json({
        success: false,
        error: 'NotFound',
        message: 'Return not found',
      });
    }

    res.json({
      success: true,
      data: returnRecord,
    });
  } catch (error) {
    logger.error('Error fetching return:', error);
    next(error);
  }
};

/**
 * Create new return
 * POST /api/returns
 * Requires: ADMIN/MANAGER/PACKER
 */
export const createReturn = async (req, res, next) => {
  try {
    const { 
      orderId, 
      customerName, 
      customerEmail, 
      customerPhone, 
      siteId, 
      reason,
      items 
    } = req.body;

    // Verify order exists and belongs to company
    if (orderId) {
      const order = await prisma.order.findFirst({
        where: {
          id: orderId,
          companyId: req.user.companyId,
        },
      });

      if (!order) {
        return res.status(400).json({
          success: false,
          error: 'InvalidOrder',
          message: 'Order not found or does not belong to your company',
        });
      }
    }

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

    // Create return with items
    const returnRecord = await prisma.return.create({
      data: {
        orderId,
        customerName,
        customerEmail,
        customerPhone,
        siteId,
        reason,
        companyId: req.user.companyId,
        items: {
          create: items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            reason: item.reason,
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

    logger.info(`Return created: ${returnRecord.id} (${customerName}) by ${req.user.email}`);

    res.status(201).json({
      success: true,
      data: returnRecord,
      message: 'Return created successfully',
    });
  } catch (error) {
    logger.error('Error creating return:', error);
    next(error);
  }
};

/**
 * Update return
 * PUT /api/returns/:id
 * Requires: ADMIN/MANAGER
 */
export const updateReturn = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { customerName, customerEmail, customerPhone, reason, status } = req.body;

    // Check if return exists and belongs to company
    const existingReturn = await prisma.return.findFirst({
      where: {
        id,
        companyId: req.user.companyId,
      },
    });

    if (!existingReturn) {
      return res.status(404).json({
        success: false,
        error: 'NotFound',
        message: 'Return not found',
      });
    }

    const returnRecord = await prisma.return.update({
      where: { id },
      data: {
        ...(customerName && { customerName }),
        ...(customerEmail !== undefined && { customerEmail }),
        ...(customerPhone !== undefined && { customerPhone }),
        ...(reason && { reason }),
        ...(status && { status }),
      },
    });

    logger.info(`Return updated: ${id} by ${req.user.email}`);

    res.json({
      success: true,
      data: returnRecord,
      message: 'Return updated successfully',
    });
  } catch (error) {
    logger.error('Error updating return:', error);
    next(error);
  }
};

/**
 * Process return
 * POST /api/returns/:id/process
 * Requires: ADMIN/MANAGER
 * Handles restocking and refund status
 */
export const processReturn = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { binId, restock } = req.body;

    // Check if return exists and belongs to company
    const returnRecord = await prisma.return.findFirst({
      where: {
        id,
        companyId: req.user.companyId,
      },
      include: {
        items: true,
      },
    });

    if (!returnRecord) {
      return res.status(404).json({
        success: false,
        error: 'NotFound',
        message: 'Return not found',
      });
    }

    if (returnRecord.status === 'PROCESSED') {
      return res.status(400).json({
        success: false,
        error: 'AlreadyProcessed',
        message: 'Return has already been processed',
      });
    }

    // Process restock if requested
    if (restock && binId) {
      for (const item of returnRecord.items) {
        const existingInventory = await prisma.inventory.findFirst({
          where: {
            productId: item.productId,
            binId,
          },
        });

        if (existingInventory) {
          await prisma.inventory.update({
            where: { id: existingInventory.id },
            data: {
              quantity: { increment: item.quantity },
            },
          });
        } else {
          await prisma.inventory.create({
            data: {
              productId: item.productId,
              binId,
              quantity: item.quantity,
              companyId: req.user.companyId,
            },
          });
        }
      }
    }

    // Update return status
    const updatedReturn = await prisma.return.update({
      where: { id },
      data: { status: restock ? 'PROCESSED' : 'REFUNDED' },
    });

    logger.info(`Return processed: ${id} by ${req.user.email}`);

    res.json({
      success: true,
      data: updatedReturn,
      message: 'Return processed successfully',
    });
  } catch (error) {
    logger.error('Error processing return:', error);
    next(error);
  }
};

/**
 * Delete return
 * DELETE /api/returns/:id
 * Requires: ADMIN only
 */
export const deleteReturn = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if return exists and belongs to company
    const existingReturn = await prisma.return.findFirst({
      where: {
        id,
        companyId: req.user.companyId,
      },
    });

    if (!existingReturn) {
      return res.status(404).json({
        success: false,
        error: 'NotFound',
        message: 'Return not found',
      });
    }

    // Prevent deletion if already processed
    if (existingReturn.status === 'PROCESSED' || existingReturn.status === 'REFUNDED') {
      return res.status(400).json({
        success: false,
        error: 'CannotDelete',
        message: 'Cannot delete a return that has been processed',
      });
    }

    await prisma.return.delete({
      where: { id },
    });

    logger.info(`Return deleted: ${id} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Return deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting return:', error);
    next(error);
  }
};
