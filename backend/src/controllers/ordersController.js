import prisma from '../config/database.js';
import logger from '../utils/logger.js';
import { stockLockService } from '../services/stockLockService.js';
import { courierService } from '../services/courierService.js';
import { validateOrderMiddleware } from '../middleware/validateOrderData.js';

/**
 * Get all orders with filtering and pagination
 * GET /api/orders
 * Requires: All authenticated users
 */
export const getOrders = async (req, res, next) => {
  try {
    const { 
      status, 
      priority, 
      assignedPicker,
      assignedPacker,
      page = 1, 
      limit = 50 
    } = req.query;

    const where = {};

    // Filter by user's site if not admin
    if (req.user.role !== 'ADMIN' && req.user.siteId) {
      where.siteId = req.user.siteId;
    }

    if (status) {
      const statuses = status.split(',').map(s => s.trim().toUpperCase());
      where.status = { in: statuses };
    }
    if (priority) where.priority = priority.toUpperCase();
    
    // Pickers see only orders assigned to them
    if (req.user.role === 'PICKER') {
      where.assignedPickerId = req.user.id;
    }
    
    // Packers see only orders assigned to them
    if (req.user.role === 'PACKER') {
      where.assignedPackerId = req.user.id;
    }

    if (assignedPicker) where.assignedPickerId = assignedPicker;
    if (assignedPacker) where.assignedPackerId = assignedPacker;

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: {
          include: { 
            product: {
              select: {
                id: true,
                sku: true,
                name: true,
                barcode: true,
                companyId: true,
              },
            },
          },
        },
        assignedPicker: {
          select: { id: true, name: true, email: true },
        },
        assignedPacker: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'asc' },
      ],
      skip: (page - 1) * limit,
      take: parseInt(limit),
    });

    const total = await prisma.order.count({ where });

    res.json({
      success: true,
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Error fetching orders:', error);
    next(error);
  }
};

/**
 * Get single order
 * GET /api/orders/:id
 * Requires: All authenticated users
 */
export const getOrder = async (req, res, next) => {
  try {
    const { id } = req.params;

    const where = {
      id,
    };

    // Non-admin users can only access orders at their site
    if (req.user.role !== 'ADMIN' && req.user.siteId) {
      where.siteId = req.user.siteId;
    }

    // Pickers can only access orders assigned to them
    if (req.user.role === 'PICKER') {
      where.assignedPickerId = req.user.id;
    }

    // Packers can only access orders assigned to them
    if (req.user.role === 'PACKER') {
      where.assignedPackerId = req.user.id;
    }

    const order = await prisma.order.findFirst({
      where,
      include: {
        items: {
          include: { product: true },
        },
        assignedPicker: {
          select: { id: true, name: true, email: true },
        },
        assignedPacker: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'NotFound',
        message: 'Order not found',
      });
    }

    res.json({ success: true, order });
  } catch (error) {
    logger.error('Error fetching order:', error);
    next(error);
  }
};

/**
 * Create new order
 * POST /api/orders
 * Requires: ADMIN/MANAGER
 */
export const createOrder = [
  validateOrderMiddleware,
  async (req, res, next) => {
  try {
    const { 
      customerName, 
      customerEmail, 
      customerPhone,
      items,
      shippingAddress,
      priority = 'NORMAL',
      notes,
      siteId,
    } = req.body;

    // Verify site belongs to company
    const site = await prisma.site.findFirst({
      where: {
        id: siteId || req.user.siteId,
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

    // Generate order ID (use UUID to avoid collisions)
    const orderId = `SO${Date.now()}${Math.random().toString(36).substr(2, 9)}`;

    // Order data is already validated and normalized by middleware
    const order = await prisma.order.create({
      data: {
        id: orderId,
        customerName,
        customerEmail,
        customerPhone,
        status: 'PENDING',
        priority: priority.toUpperCase(),
        estimatedPickMinutes: req.body.estimatedPickMinutes || 10, // Default from middleware
        shippingAddress,
        notes,
        siteId: siteId || req.user.siteId,
        items: {
          create: items.map((item) => ({
            sku: item.sku,
            name: item.name,
            barcode: item.barcode && item.barcode.trim() !== '' ? item.barcode : `940${Math.floor(Math.random() * 10000000000)}`,
            quantity: item.quantity,
            pickedQuantity: 0,
            packedQuantity: 0,
            location: item.location || 'UNKNOWN', // Default from middleware
          })),
        },
      },
      include: { items: true },
    });

    logger.info(`Order created: ${orderId} by ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order,
    });
  } catch (error) {
    logger.error('Error creating order:', error);
    next(error);
  }
}
];

/**
 * Update order status
 * PUT /api/orders/:id/status
 * Requires: ADMIN/MANAGER
 */
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    // Check if order exists
    const where = {
      id,
    };

    if (req.user.role !== 'ADMIN' && req.user.siteId) {
      where.siteId = req.user.siteId;
    }

    const existingOrder = await prisma.order.findFirst({ where });

    if (!existingOrder) {
      return res.status(404).json({
        success: false,
        error: 'NotFound',
        message: 'Order not found',
      });
    }

    const order = await prisma.order.update({
      where: { id },
      data: { status: status.toUpperCase() },
      include: { items: true },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        userId: req.user.id,
        type: 'ORDER_PICKED',
        entityType: 'Order',
        entityId: id,
        description: `Order ${id} status updated to ${status}`,
        metadata: { status },
      },
    });

    logger.info(`Order ${id} status updated to ${status} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Order status updated successfully',
      order,
    });
  } catch (error) {
    logger.error('Error updating order status:', error);
    next(error);
  }
};

/**
 * Assign picker to order
 * POST /api/orders/:id/assign-picker
 * Requires: ADMIN/MANAGER
 */
export const assignPicker = async (req, res, next) => {
  try {
    const { pickerId } = req.body;
    const { id } = req.params;

    // Verify picker exists and belongs to company
    const picker = await prisma.user.findFirst({
      where: {
        id: pickerId,
        companyId: req.user.companyId,
        role: { in: ['PICKER', 'ADMIN', 'MANAGER'] },
      },
    });

    if (!picker) {
      return res.status(400).json({
        success: false,
        error: 'InvalidPicker',
        message: 'Picker not found or does not belong to your company',
      });
    }

    // Check if order exists
    const where = {
      id,
    };

    if (req.user.role !== 'ADMIN' && req.user.siteId) {
      where.siteId = req.user.siteId;
    }

    const existingOrder = await prisma.order.findFirst({ where });

    if (!existingOrder) {
      return res.status(404).json({
        success: false,
        error: 'NotFound',
        message: 'Order not found',
      });
    }

    const order = await prisma.order.update({
      where: { id },
      data: {
        assignedPickerId: pickerId,
        status: 'PICKING',
      },
      include: {
        items: { include: { product: true } },
        assignedPicker: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    logger.info(`Order ${id} assigned to picker ${pickerId} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Picker assigned successfully',
      order,
    });
  } catch (error) {
    logger.error('Error assigning picker:', error);
    next(error);
  }
};

/**
 * Pick item with atomic stock reservation
 * POST /api/orders/:id/pick
 * Requires: PICKER (assigned to order) or ADMIN/MANAGER
 * 
 * ENFORCED ATOMICITY:
 * - Locks stock before operation (prevents race conditions)
 * - Commits lock on successful pick
 * - Releases lock on failure
 * - Full audit trail via InventoryTransaction
 */
export const pickItem = async (req, res, next) => {
  let lockId = null;
  try {
    const { id } = req.params;
    const { itemId, quantity, binLocation } = req.body;

    // Check if order exists
    const where = {
      id,
    };

    if (req.user.role !== 'ADMIN') {
      if (req.user.siteId) {
        where.siteId = req.user.siteId;
      }
      if (req.user.role === 'PICKER') {
        where.assignedPickerId = req.user.id;
      }
    }

    const order = await prisma.order.findFirst({ where });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'NotFound',
        message: 'Order not found or you are not authorized to pick this order',
      });
    }

    const orderItem = await prisma.orderItem.findUnique({
      where: { id: itemId },
      include: { order: true, product: true },
    });

    if (!orderItem || orderItem.orderId !== id) {
      return res.status(404).json({
        success: false,
        error: 'NotFound',
        message: 'Order item not found',
      });
    }

    // Validate binLocation is provided
    if (!binLocation) {
      return res.status(400).json({
        success: false,
        error: 'ValidationError',
        message: 'binLocation is required for atomic stock reservation',
      });
    }

    // Prevent over-picking
    if (orderItem.pickedQuantity + quantity > orderItem.quantity) {
      return res.status(400).json({
        success: false,
        error: 'ValidationError',
        message: 'Cannot pick more than ordered quantity',
      });
    }

    // ATOMIC: Lock stock before picking
    const lockResult = await stockLockService.reserveStock({
      sku: orderItem.sku,
      quantity: quantity,
      binLocation: binLocation,
      operationType: 'PICK',
      operatorId: req.user.id,
      orderId: id,
    });

    if (!lockResult.success) {
      return res.status(409).json({
        success: false,
        error: 'StockUnavailable',
        message: lockResult.message || 'Insufficient stock available',
      });
    }

    lockId = lockResult.lockId;

    // Update order item
    const updatedItem = await prisma.orderItem.update({
      where: { id: itemId },
      data: {
        pickedQuantity: orderItem.pickedQuantity + quantity,
      },
    });

    // Commit the stock lock (actual inventory deduction)
    const commitResult = await stockLockService.commitLock(lockId, req.user.id);
    if (!commitResult.success) {
      logger.error(`Failed to commit lock ${lockId} after successful pick`);
      // Continue - order was picked but lock failed (manual reconciliation needed)
    }

    // Update order status if all items picked
    const updatedOrder = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    const allPicked = updatedOrder.items.every(item => item.pickedQuantity >= item.quantity);
    if (allPicked) {
      const previousStatus = updatedOrder.status;
      
      // Only update stats if this is the first time transitioning from PICKING to READY_TO_PACK
      if (previousStatus === 'PICKING' || previousStatus === 'PENDING') {
        await prisma.order.update({
          where: { id },
          data: { status: 'READY_TO_PACK' },
        });

        // Update user stats (only if actual picker)
        if (req.user.role === 'PICKER') {
          await prisma.userStats.update({
            where: { userId: req.user.id },
            data: {
              ordersPicked: { increment: 1 },
              itemsPicked: { increment: quantity },
            },
          });
        }
      } else {
        // Just update status without stats (idempotency)
        await prisma.order.update({
          where: { id },
          data: { status: 'READY_TO_PACK' },
        });
      }
    }

    logger.info(`Item picked: ${itemId} for order ${id} by ${req.user.email} (lock: ${lockId})`);

    res.json({
      success: true,
      message: 'Item picked successfully',
      item: updatedItem,
      orderReadyToPack: allPicked,
      stockLock: {
        id: lockId,
        committed: commitResult.success,
      },
    });
  } catch (error) {
    logger.error('Error picking item:', error);
    
    // Release lock on any error
    if (lockId) {
      try {
        await stockLockService.releaseLock(lockId, req.user.id, 'Error during pick operation');
      } catch (releaseError) {
        logger.error(`Failed to release lock ${lockId}:`, releaseError);
      }
    }
    
    next(error);
  }
};

/**
 * Assign packer to order
 * POST /api/orders/:id/assign-packer
 * Requires: ADMIN/MANAGER
 */
export const assignPacker = async (req, res, next) => {
  try {
    const { packerId } = req.body;
    const { id } = req.params;

    // Verify packer exists and belongs to company
    const packer = await prisma.user.findFirst({
      where: {
        id: packerId,
        companyId: req.user.companyId,
        role: { in: ['PACKER', 'ADMIN', 'MANAGER'] },
      },
    });

    if (!packer) {
      return res.status(400).json({
        success: false,
        error: 'InvalidPacker',
        message: 'Packer not found or does not belong to your company',
      });
    }

    // Check if order exists
    const where = {
      id,
    };

    if (req.user.role !== 'ADMIN' && req.user.siteId) {
      where.siteId = req.user.siteId;
    }

    const existingOrder = await prisma.order.findFirst({ where });

    if (!existingOrder) {
      return res.status(404).json({
        success: false,
        error: 'NotFound',
        message: 'Order not found',
      });
    }

    const order = await prisma.order.update({
      where: { id },
      data: { assignedPackerId: packerId },
      include: {
        items: { include: { product: true } },
        assignedPacker: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    logger.info(`Order ${id} assigned to packer ${packerId} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Packer assigned successfully',
      order,
    });
  } catch (error) {
    logger.error('Error assigning packer:', error);
    next(error);
  }
};

/**
 * Pack order with label generation
 * POST /api/orders/:id/pack
 * Requires: PACKER (assigned to order) or ADMIN/MANAGER
 * 
 * Automatically generates shipping label via courier service if courier specified
 */
export const packOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { packageType, trackingNumber, courier, generateLabel = true } = req.body;

    // Check if order exists
    const where = {
      id,
    };

    if (req.user.role !== 'ADMIN') {
      if (req.user.siteId) {
        where.siteId = req.user.siteId;
      }
      if (req.user.role === 'PACKER') {
        where.assignedPackerId = req.user.id;
      }
    }

    const orderForValidation = await prisma.order.findFirst({
      where,
      include: { items: true },
    });

    if (!orderForValidation) {
      return res.status(404).json({
        success: false,
        error: 'NotFound',
        message: 'Order not found or you are not authorized to pack this order',
      });
    }

    if (orderForValidation.status !== 'READY_TO_PACK') {
      return res.status(400).json({
        success: false,
        error: 'InvalidStatus',
        message: 'Order must be in READY_TO_PACK status to be packed',
      });
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: { product: true },
        },
        company: true,
        site: true,
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'NotFound',
        message: 'Order not found',
      });
    }

    let generatedTrackingNumber = trackingNumber;
    let labelData = null;

    // Generate label if courier specified and requested
    if (generateLabel && courier && !trackingNumber) {
      const labelResult = await courierService.generateLabel(order, courier);
      
      if (labelResult.success) {
        generatedTrackingNumber = labelResult.trackingNumber;
        labelData = {
          labelUrl: labelResult.labelUrl,
          pdfData: labelResult.pdfData,
          cost: labelResult.cost,
          estimatedDelivery: labelResult.estimatedDelivery,
        };
        logger.info(`Label generated for order ${id} via ${courier}: ${labelResult.trackingNumber}`);
      } else {
        logger.error(`Failed to generate label for order ${id}: ${labelResult.error}`);
        // Continue without label - allow manual label entry
      }
    }

    const previousStatus = order.status;
    
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status: 'PACKED',
        packageType,
        trackingNumber: generatedTrackingNumber,
        courier,
        packedAt: new Date(),
      },
      include: {
        items: true,
        assignedPacker: { select: { id: true, name: true } },
      },
    });

    // Update all items as packed
    await prisma.orderItem.updateMany({
      where: { orderId: id },
      data: { packedQuantity: prisma.orderItem.fields.quantity },
    });

    // Update user stats (only if actual packer and first time packing)
    if (req.user.role === 'PACKER' && previousStatus === 'READY_TO_PACK') {
      const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
      await prisma.userStats.update({
        where: { userId: req.user.id },
        data: {
          ordersPacked: { increment: 1 },
          itemsPacked: { increment: totalItems },
        },
      });
    }

    // Log activity
    await prisma.activity.create({
      data: {
        userId: req.user.id,
        type: 'ORDER_PACKED',
        entityType: 'Order',
        entityId: id,
        description: `Order ${id} packed`,
        metadata: { trackingNumber, packageType },
      },
    });

    logger.info(`Order ${id} packed with tracking ${generatedTrackingNumber} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Order packed successfully',
      order: updatedOrder,
      label: labelData,
    });
  } catch (error) {
    logger.error('Error packing order:', error);
    next(error);
  }
};

/**
 * Ship order
 * POST /api/orders/:id/ship
 * Requires: ADMIN/MANAGER
 */
export const shipOrder = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if order exists
    const where = {
      id,
    };

    if (req.user.role !== 'ADMIN' && req.user.siteId) {
      where.siteId = req.user.siteId;
    }

    const existingOrder = await prisma.order.findFirst({ where });

    if (!existingOrder) {
      return res.status(404).json({
        success: false,
        error: 'NotFound',
        message: 'Order not found',
      });
    }

    const previousStatus = existingOrder.status;

    const order = await prisma.order.update({
      where: { id },
      data: {
        status: 'SHIPPED',
        shippedAt: new Date(),
      },
    });

    // Update user stats (only if first time transitioning to SHIPPED)
    if (previousStatus === 'PACKED' || previousStatus === 'READY_TO_PACK') {
      await prisma.userStats.update({
        where: { userId: req.user.id },
        data: {
          ordersProcessed: { increment: 1 },
        },
      });
    }

    // Log activity
    await prisma.activity.create({
      data: {
        userId: req.user.id,
        type: 'ORDER_SHIPPED',
        entityType: 'Order',
        entityId: id,
        description: `Order ${id} shipped`,
      },
    });

    logger.info(`Order ${id} shipped by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Order shipped successfully',
      order,
    });
  } catch (error) {
    logger.error('Error shipping order:', error);
    next(error);
  }
};

/**
 * Get order statistics
 * GET /api/orders/stats
 * Requires: ADMIN/MANAGER
 */
export const getOrderStats = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    const where = {};

    if (req.user.role !== 'ADMIN' && req.user.siteId) {
      where.siteId = req.user.siteId;
    }

    if (startDate || endDate) {
      where.createdAt = dateFilter;
    }

    const [
      totalOrders,
      pendingOrders,
      pickingOrders,
      readyToPackOrders,
      packedOrders,
      shippedOrders,
      urgentOrders,
    ] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.count({ where: { ...where, status: 'PENDING' } }),
      prisma.order.count({ where: { ...where, status: 'PICKING' } }),
      prisma.order.count({ where: { ...where, status: 'READY_TO_PACK' } }),
      prisma.order.count({ where: { ...where, status: 'PACKED' } }),
      prisma.order.count({ where: { ...where, status: 'SHIPPED' } }),
      prisma.order.count({ where: { ...where, priority: 'URGENT', status: { not: 'SHIPPED' } } }),
    ]);

    res.json({
      success: true,
      stats: {
        totalOrders,
        pendingOrders,
        pickingOrders,
        readyToPackOrders,
        packedOrders,
        shippedOrders,
        urgentOrders,
      },
    });
  } catch (error) {
    logger.error('Error fetching order stats:', error);
    next(error);
  }
};