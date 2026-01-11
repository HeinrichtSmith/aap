import prisma from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * Get all sites
 * GET /api/sites
 */
export const getAllSites = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, active = 'true' } = req.query;
    const skip = (page - 1) * limit;

    const where = {
      companyId: req.user.companyId,
    };

    if (active !== 'all') {
      where.isActive = active === 'true';
    }

    const [sites, total] = await Promise.all([
      prisma.site.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.site.count({ where }),
    ]);

    res.json({
      success: true,
      data: sites,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Error fetching sites:', error);
    next(error);
  }
};

/**
 * Get single site by ID
 * GET /api/sites/:id
 */
export const getSiteById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const site = await prisma.site.findFirst({
      where: {
        id,
        companyId: req.user.companyId,
      },
    });

    if (!site) {
      return res.status(404).json({
        success: false,
        error: 'NotFound',
        message: 'Site not found',
      });
    }

    res.json({
      success: true,
      data: site,
    });
  } catch (error) {
    logger.error('Error fetching site:', error);
    next(error);
  }
};

/**
 * Create new site
 * POST /api/sites
 */
export const createSite = async (req, res, next) => {
  try {
    const { code, name, address, isActive = true } = req.body;

    // Check if site code already exists
    const existingSite = await prisma.site.findUnique({
      where: { code },
    });

    if (existingSite) {
      return res.status(409).json({
        success: false,
        error: 'Conflict',
        message: 'Site code already exists',
      });
    }

    const site = await prisma.site.create({
      data: {
        code,
        name,
        address,
        isActive,
        companyId: req.user.companyId,
      },
    });

    logger.info(`Site created: ${site.id} by ${req.user.email}`);

    res.status(201).json({
      success: true,
      data: site,
      message: 'Site created successfully',
    });
  } catch (error) {
    logger.error('Error creating site:', error);
    next(error);
  }
};

/**
 * Update site
 * PUT /api/sites/:id
 */
export const updateSite = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { code, name, address, isActive } = req.body;

    // Check if site exists and belongs to company
    const existingSite = await prisma.site.findFirst({
      where: {
        id,
        companyId: req.user.companyId,
      },
    });

    if (!existingSite) {
      return res.status(404).json({
        success: false,
        error: 'NotFound',
        message: 'Site not found',
      });
    }

    // Check if new code conflicts with another site
    if (code && code !== existingSite.code) {
      const codeConflict = await prisma.site.findUnique({
        where: { code },
      });

      if (codeConflict) {
        return res.status(409).json({
          success: false,
          error: 'Conflict',
          message: 'Site code already exists',
        });
      }
    }

    const site = await prisma.site.update({
      where: { id },
      data: {
        ...(code && { code }),
        ...(name && { name }),
        ...(address !== undefined && { address }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    logger.info(`Site updated: ${site.id} by ${req.user.email}`);

    res.json({
      success: true,
      data: site,
      message: 'Site updated successfully',
    });
  } catch (error) {
    logger.error('Error updating site:', error);
    next(error);
  }
};

/**
 * Delete site
 * DELETE /api/sites/:id
 */
export const deleteSite = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if site exists and belongs to company
    const existingSite = await prisma.site.findFirst({
      where: {
        id,
        companyId: req.user.companyId,
      },
      include: {
        _count: {
          select: {
            users: true,
            orders: true,
            inventory: true,
          },
        },
      },
    });

    if (!existingSite) {
      return res.status(404).json({
        success: false,
        error: 'NotFound',
        message: 'Site not found',
      });
    }

    // Check if site has dependencies
    if (existingSite._count.users > 0 || existingSite._count.orders > 0 || existingSite._count.inventory > 0) {
      return res.status(400).json({
        success: false,
        error: 'ValidationError',
        message: 'Cannot delete site with active users, orders, or inventory',
        details: {
          users: existingSite._count.users,
          orders: existingSite._count.orders,
          inventory: existingSite._count.inventory,
        },
      });
    }

    await prisma.site.delete({
      where: { id },
    });

    logger.info(`Site deleted: ${id} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Site deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting site:', error);
    next(error);
  }
};
