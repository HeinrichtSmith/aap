/**
 * REPORTS CONTROLLER
 * 
 * Handles reporting and analytics operations.
 * Business intelligence and data export capabilities.
 */

import prisma from '../config/database.js';
import { inventorySummaryService } from '../services/inventorySummaryService.js';
import { warehouseMapService } from '../services/warehouseMapService.js';
import logger from '../utils/logger.js';

/**
 * Get inventory health summary
 * GET /api/reports/inventory/health
 */
export const getInventoryHealth = async (req, res, next) => {
  try {
    const { siteId } = req.query;

    const where = {
      companyId: req.user.companyId,
    };

    if (req.user.role !== 'ADMIN' && req.user.siteId) {
      where.siteId = req.user.siteId;
    } else if (siteId) {
      where.siteId = siteId;
    }

    const health = await inventorySummaryService.summarizeInventoryHealth(where);

    res.json({
      success: true,
      health,
    });
  } catch (error) {
    logger.error('Error generating inventory health report:', error);
    next(error);
  }
};

/**
 * Get zone-level inventory summary
 * GET /api/reports/inventory/zones
 */
export const getZoneInventory = async (req, res, next) => {
  try {
    const { siteId } = req.query;

    const where = {
      companyId: req.user.companyId,
    };

    if (req.user.role !== 'ADMIN' && req.user.siteId) {
      where.siteId = req.user.siteId;
    } else if (siteId) {
      where.siteId = siteId;
    }

    // Get inventory grouped by zone
    const zones = await prisma.inventoryItem.groupBy({
      by: ['binLocation'],
      where,
      _count: { id: true },
      _sum: {
        quantityTotal: true,
        quantityAvailable: true,
        quantityReserved: true,
      },
    });

    // Extract zone from bin location (e.g., "A-01-05" -> "A")
    const zoneMap = {};
    zones.forEach(zone => {
      const zoneName = zone.binLocation.split('-')[0];
      if (!zoneMap[zoneName]) {
        zoneMap[zoneName] = {
          zone: zoneName,
          itemCount: 0,
          totalQuantity: 0,
          availableQuantity: 0,
          reservedQuantity: 0,
        };
      }
      zoneMap[zoneName].itemCount += zone._count.id;
      zoneMap[zoneName].totalQuantity += zone._sum.quantityTotal || 0;
      zoneMap[zoneName].availableQuantity += zone._sum.quantityAvailable || 0;
      zoneMap[zoneName].reservedQuantity += zone._sum.quantityReserved || 0;
    });

    res.json({
      success: true,
      zones: Object.values(zoneMap),
    });
  } catch (error) {
    logger.error('Error generating zone inventory report:', error);
    next(error);
  }
};

/**
 * Get order performance report
 * GET /api/reports/orders/performance
 */
export const getOrderPerformance = async (req, res, next) => {
  try {
    const { startDate, endDate, siteId } = req.query;

    const dateFilter = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    const where = {
      companyId: req.user.companyId,
      ...(startDate || endDate ? { createdAt: dateFilter } : {}),
    };

    if (req.user.role !== 'ADMIN' && req.user.siteId) {
      where.siteId = req.user.siteId;
    } else if (siteId) {
      where.siteId = siteId;
    }

    const [
      totalOrders,
      avgFulfillmentTime,
      ordersByStatus,
      ordersByPriority,
      ordersByCourier,
    ] = await Promise.all([
      prisma.order.count({ where }),
      
      // Average fulfillment time (from creation to shipping)
      prisma.order.aggregate({
        where: { ...where, status: 'SHIPPED' },
        _avg: {
          shippedAt: true,
          createdAt: true,
        },
      }),
      
      // Orders by status
      prisma.order.groupBy({
        by: ['status'],
        where,
        _count: { id: true },
      }),
      
      // Orders by priority
      prisma.order.groupBy({
        by: ['priority'],
        where,
        _count: { id: true },
      }),
      
      // Orders by courier
      prisma.order.groupBy({
        by: ['courier'],
        where: { ...where, courier: { not: null } },
        _count: { id: true },
      }),
    ]);

    // Calculate average fulfillment time in hours
    let avgHours = null;
    if (avgFulfillmentTime._avg.shippedAt && avgFulfillmentTime._avg.createdAt) {
      const diff = new Date(avgFulfillmentTime._avg.shippedAt) - new Date(avgFulfillmentTime._avg.createdAt);
      avgHours = Math.round(diff / (1000 * 60 * 60) * 10) / 10; // Round to 1 decimal
    }

    res.json({
      success: true,
      performance: {
        totalOrders,
        avgFulfillmentHours: avgHours,
        ordersByStatus: ordersByStatus.map(s => ({
          status: s.status,
          count: s._count.id,
        })),
        ordersByPriority: ordersByPriority.map(p => ({
          priority: p.priority,
          count: p._count.id,
        })),
        ordersByCourier: ordersByCourier.map(c => ({
          courier: c.courier,
          count: c._count.id,
        })),
      },
    });
  } catch (error) {
    logger.error('Error generating order performance report:', error);
    next(error);
  }
};

/**
 * Get picker performance report
 * GET /api/reports/pickers/performance
 */
export const getPickerPerformance = async (req, res, next) => {
  try {
    const { startDate, endDate, siteId } = req.query;

    const dateFilter = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    const where = {
      companyId: req.user.companyId,
      ...(startDate || endDate ? { createdAt: dateFilter } : {}),
    };

    if (req.user.role !== 'ADMIN' && req.user.siteId) {
      where.siteId = req.user.siteId;
    } else if (siteId) {
      where.siteId = siteId;
    }

    // Get picker stats
    const pickers = await prisma.user.findMany({
      where: {
        companyId: req.user.companyId,
        role: 'PICKER',
        ...(siteId ? { siteId } : {}),
      },
      include: {
        stats: true,
        assignedOrders: {
          where: { ...(startDate || endDate ? { createdAt: dateFilter } : {}) },
          _count: true,
        },
      },
    });

    const performance = pickers.map(picker => ({
      id: picker.id,
      name: picker.name,
      email: picker.email,
      itemsPicked: picker.stats?.itemsPicked || 0,
      ordersProcessed: picker.stats?.ordersProcessed || 0,
      accuracyRate: picker.stats?.accuracyRate || 0,
      xp: picker.stats?.xp || 0,
      level: picker.stats?.level || 1,
      recentOrders: picker.assignedOrders._count || 0,
    }));

    res.json({
      success: true,
      pickers: performance,
    });
  } catch (error) {
    logger.error('Error generating picker performance report:', error);
    next(error);
  }
};

/**
 * Get actionable insights
 * GET /api/reports/insights
 */
export const getInsights = async (req, res, next) => {
  try {
    const { limit = 10, siteId } = req.query;

    const where = {
      companyId: req.user.companyId,
    };

    if (req.user.role !== 'ADMIN' && req.user.siteId) {
      where.siteId = req.user.siteId;
    } else if (siteId) {
      where.siteId = siteId;
    }

    const insights = await inventorySummaryService.getActionableInsights(
      parseInt(limit),
      where
    );

    res.json({
      success: true,
      insights,
    });
  } catch (error) {
    logger.error('Error generating insights:', error);
    next(error);
  }
};

/**
 * Get warehouse map
 * GET /api/reports/warehouse/map
 */
export const getWarehouseMap = async (req, res, next) => {
  try {
    const { siteId } = req.query;

    const mapSiteId = req.user.role === 'ADMIN' && siteId ? siteId : req.user.siteId;

    if (!mapSiteId) {
      return res.status(400).json({
        success: false,
        error: 'InvalidRequest',
        message: 'Site ID required',
      });
    }

    const map = await warehouseMapService.getWarehouseMap(mapSiteId);

    res.json({
      success: true,
      map,
    });
  } catch (error) {
    logger.error('Error generating warehouse map:', error);
    next(error);
  }
};

/**
 * Calculate travel distance for pick path
 * POST /api/reports/picks/travel-distance
 */
export const calculateTravelDistance = async (req, res, next) => {
  try {
    const { bins, siteId } = req.body;

    if (!bins || !Array.isArray(bins) || bins.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'InvalidRequest',
        message: 'bins array is required',
      });
    }

    const mapSiteId = req.user.role === 'ADMIN' && siteId ? siteId : req.user.siteId;

    if (!mapSiteId) {
      return res.status(400).json({
        success: false,
        error: 'InvalidRequest',
        message: 'Site ID required',
      });
    }

    // Calculate total travel distance
    let totalDistance = 0;
    for (let i = 0; i < bins.length - 1; i++) {
      const result = await warehouseMapService.getTravelDistance(
        bins[i],
        bins[i + 1],
        mapSiteId
      );
      totalDistance += result.distance;
    }

    // Calculate efficiency score
    const efficiency = await warehouseMapService.calculatePickPathEfficiency(bins, mapSiteId);

    res.json({
      success: true,
      travelDistance: {
        totalDistance,
        totalBins: bins.length,
        avgDistancePerBin: bins.length > 0 ? totalDistance / bins.length : 0,
      },
      efficiency,
    });
  } catch (error) {
    logger.error('Error calculating travel distance:', error);
    next(error);
  }
};

/**
 * Get velocity groups (pick frequency analysis)
 * GET /api/reports/inventory/velocity
 */
export const getVelocityGroups = async (req, res, next) => {
  try {
    const { siteId } = req.query;

    const where = {
      companyId: req.user.companyId,
    };

    if (req.user.role !== 'ADMIN' && req.user.siteId) {
      where.siteId = req.user.siteId;
    } else if (siteId) {
      where.siteId = siteId;
    }

    const velocity = await inventorySummaryService.summarizeVelocityGroups(where);

    res.json({
      success: true,
      velocity,
    });
  } catch (error) {
    logger.error('Error generating velocity report:', error);
    next(error);
  }
};

/**
 * Export report as CSV
 * GET /api/reports/export/:type
 */
export const exportReport = async (req, res, next) => {
  try {
    const { type } = req.params;
    const { siteId, startDate, endDate } = req.query;

    const where = {
      companyId: req.user.companyId,
    };

    if (req.user.role !== 'ADMIN' && req.user.siteId) {
      where.siteId = req.user.siteId;
    } else if (siteId) {
      where.siteId = siteId;
    }

    let data = [];
    let filename = '';

    switch (type) {
      case 'inventory':
        data = await prisma.inventoryItem.findMany({
          where,
          include: {
            product: { select: { name: true, barcode: true } },
            site: { select: { name: true } },
          },
        });
        filename = `inventory_${Date.now()}.csv`;
        break;

      case 'orders':
        const dateFilter = {};
        if (startDate) dateFilter.gte = new Date(startDate);
        if (endDate) dateFilter.lte = new Date(endDate);
        
        data = await prisma.order.findMany({
          where: {
            ...where,
            ...(startDate || endDate ? { createdAt: dateFilter } : {}),
          },
          include: {
            site: { select: { name: true } },
            items: true,
          },
        });
        filename = `orders_${Date.now()}.csv`;
        break;

      default:
        return res.status(400).json({
          success: false,
          error: 'InvalidType',
          message: 'Invalid report type. Use: inventory, orders',
        });
    }

    // Convert to CSV
    const csv = convertToCSV(data);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (error) {
    logger.error('Error exporting report:', error);
    next(error);
  }
};

/**
 * Convert array of objects to CSV
 */
function convertToCSV(data) {
  if (!data || data.length === 0) return '';

  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(item => {
    return Object.values(item).map(value => {
      // Handle nested objects
      if (typeof value === 'object' && value !== null) {
        return JSON.stringify(value);
      }
      // Escape quotes and wrap in quotes
      const strValue = String(value || '');
      return `"${strValue.replace(/"/g, '""')}"`;
    }).join(',');
  }).join('\n');

  return `${headers}\n${rows}`;
}
