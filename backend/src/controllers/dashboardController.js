import prisma from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * Get dashboard statistics
 * GET /api/dashboard/stats
 * Requires: All authenticated users
 */
export const getDashboardStats = async (req, res, next) => {
  try {
    const where = {};

    // Non-admin users only see stats from their site
    if (req.user.role !== 'ADMIN' && req.user.siteId) {
      where.siteId = req.user.siteId;
    }

    // Get order stats
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

    // Get inventory stats
    const productWhere = {};
    if (req.user.role !== 'ADMIN' && req.user.companyId) {
      productWhere.companyId = req.user.companyId;
    }

    const [
      totalProducts,
      totalInventory,
      lowStockItems,
    ] = await Promise.all([
      prisma.product.count({ where: productWhere }),
      prisma.inventoryItem.aggregate({
        where: productWhere,
        _sum: { quantityTotal: true },
      }).then(result => result._sum.quantityTotal || 0),
      prisma.inventoryItem.count({
        where: {
          ...productWhere,
          quantityAvailable: { lte: 10 },
        },
      }),
    ]);

    // Get user stats (for team performance)
    const [activeUsers, totalUsers] = await Promise.all([
      prisma.user.count({
        where: {
          companyId: req.user.companyId,
          ...(req.user.siteId ? { siteId: req.user.siteId } : {}),
        },
      }),
      prisma.user.count({
        where: {
          companyId: req.user.companyId,
        },
      }),
    ]);

    res.json({
      success: true,
      stats: {
        // Order stats
        totalOrders,
        pendingOrders,
        pickingOrders,
        readyToPackOrders,
        packedOrders,
        shippedOrders,
        urgentOrders,
        
        // Inventory stats
        totalProducts,
        totalInventory,
        lowStockItems,
        
        // Team stats
        activeUsers,
        totalUsers,
      },
    });
  } catch (error) {
    logger.error('Error fetching dashboard stats:', error);
    next(error);
  }
};

/**
 * Get recent activity
 * GET /api/dashboard/activity
 * Requires: All authenticated users
 */
export const getRecentActivity = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;

    const where = {};

    // Non-admin users only see activity from their site
    if (req.user.role !== 'ADMIN' && req.user.siteId) {
      where.user = {
        siteId: req.user.siteId,
      };
    }

    const activities = await prisma.activity.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: parseInt(limit),
    });

    res.json({
      success: true,
      activities,
    });
  } catch (error) {
    logger.error('Error fetching recent activity:', error);
    next(error);
  }
};