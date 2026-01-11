import prisma from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * Get all bins with filtering and pagination
 * GET /api/bins
 * Requires: All authenticated users
 */
export const getBins = async (req, res, next) => {
  try {
    const { 
      aisle, 
      row, 
      type, 
      isAvailable,
      page = 1, 
      limit = 50 
    } = req.query;

    const where = {
      companyId: req.user.companyId,
    };

    if (aisle) where.aisle = aisle;
    if (row) where.row = row;
    if (type) where.type = type;
    if (isAvailable !== undefined) where.isAvailable = isAvailable === 'true';

    const bins = await prisma.bin.findMany({
      where,
      include: {
        inventoryItems: {
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
        products: {
          include: {
            product: {
              select: {
                id: true,
                sku: true,
                name: true,
                companyId: true,
              },
            },
          },
        },
      },
      orderBy: [
        { aisle: 'asc' },
        { row: 'asc' },
        { column: 'asc' },
      ],
      skip: (page - 1) * limit,
      take: parseInt(limit),
    });

    const total = await prisma.bin.count({ where });

    res.json({
      success: true,
      bins,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Error fetching bins:', error);
    next(error);
  }
};

/**
 * Get single bin
 * GET /api/bins/:id
 * Requires: All authenticated users
 */
export const getBin = async (req, res, next) => {
  try {
    const { id } = req.params;

    const bin = await prisma.bin.findFirst({
      where: {
        id,
        companyId: req.user.companyId,
      },
      include: {
        inventoryItems: {
          include: { product: true },
        },
        products: {
          include: { product: true },
        },
      },
    });

    if (!bin) {
      return res.status(404).json({
        success: false,
        error: 'NotFound',
        message: 'Bin not found',
      });
    }

    res.json({ success: true, bin });
  } catch (error) {
    logger.error('Error fetching bin:', error);
    next(error);
  }
};

/**
 * Get bin by code
 * GET /api/bins/code/:code
 * Requires: All authenticated users
 */
export const getBinByCode = async (req, res, next) => {
  try {
    const { code } = req.params;

    const bin = await prisma.bin.findFirst({
      where: {
        code: code.toUpperCase(),
        companyId: req.user.companyId,
      },
      include: {
        inventoryItems: {
          include: { product: true },
        },
        products: {
          include: { product: true },
        },
      },
    });

    if (!bin) {
      return res.status(404).json({
        success: false,
        error: 'NotFound',
        message: 'Bin not found',
      });
    }

    res.json({ success: true, bin });
  } catch (error) {
    logger.error('Error fetching bin by code:', error);
    next(error);
  }
};

/**
 * Create bin
 * POST /api/bins
 * Requires: ADMIN/MANAGER
 */
export const createBin = async (req, res, next) => {
  try {
    const {
      code,
      aisle,
      row,
      column,
      level,
      capacity,
      type,
      isAvailable,
    } = req.body;

    const bin = await prisma.bin.create({
      data: {
        code: code.toUpperCase(),
        aisle,
        row,
        column,
        level,
        capacity,
        type,
        isAvailable,
        companyId: req.user.companyId,
      },
    });

    logger.info(`Bin created: ${code} by ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Bin created successfully',
      bin,
    });
  } catch (error) {
    logger.error('Error creating bin:', error);
    next(error);
  }
};

/**
 * Update bin
 * PUT /api/bins/:id
 * Requires: ADMIN/MANAGER
 */
export const updateBin = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if bin exists and belongs to company
    const existingBin = await prisma.bin.findFirst({
      where: {
        id,
        companyId: req.user.companyId,
      },
    });

    if (!existingBin) {
      return res.status(404).json({
        success: false,
        error: 'NotFound',
        message: 'Bin not found',
      });
    }

    const bin = await prisma.bin.update({
      where: { id },
      data: req.body,
    });

    logger.info(`Bin updated: ${bin.code} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Bin updated successfully',
      bin,
    });
  } catch (error) {
    logger.error('Error updating bin:', error);
    next(error);
  }
};

/**
 * Delete bin
 * DELETE /api/bins/:id
 * Requires: ADMIN only
 */
export const deleteBin = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if bin exists and belongs to company
    const existingBin = await prisma.bin.findFirst({
      where: {
        id,
        companyId: req.user.companyId,
      },
    });

    if (!existingBin) {
      return res.status(404).json({
        success: false,
        error: 'NotFound',
        message: 'Bin not found',
      });
    }

    // Check if bin has inventory
    const inventoryCount = await prisma.inventoryItem.count({
      where: { binId: id },
    });

    if (inventoryCount > 0) {
      return res.status(400).json({
        success: false,
        error: 'HasInventory',
        message: 'Cannot delete bin with existing inventory. Please remove inventory first.',
      });
    }

    // Check if bin has products
    const binProductCount = await prisma.binProduct.count({
      where: { binId: id },
    });

    if (binProductCount > 0) {
      return res.status(400).json({
        success: false,
        error: 'HasProducts',
        message: 'Cannot delete bin with existing products. Please remove products first.',
      });
    }

    await prisma.bin.delete({
      where: { id },
    });

    logger.info(`Bin deleted: ${id} (${existingBin.code}) by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Bin deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting bin:', error);
    next(error);
  }
};

/**
 * Get bins by location (aisle/row)
 * GET /api/bins/location/:aisle/:row
 * Requires: All authenticated users
 */
export const getBinsByLocation = async (req, res, next) => {
  try {
    const { aisle, row } = req.params;

    const bins = await prisma.bin.findMany({
      where: {
        aisle: aisle.toUpperCase(),
        row: row.toUpperCase(),
        companyId: req.user.companyId,
      },
      include: {
        inventoryItems: {
          include: { product: true },
        },
      },
      orderBy: { column: 'asc' },
    });

    res.json({ success: true, bins });
  } catch (error) {
    logger.error('Error fetching bins by location:', error);
    next(error);
  }
};

/**
 * Get available bins for storage
 * GET /api/bins/available
 * Requires: All authenticated users
 */
export const getAvailableBins = async (req, res, next) => {
  try {
    const { type } = req.query;

    const where = {
      companyId: req.user.companyId,
      isAvailable: true,
    };

    if (type) where.type = type;

    const bins = await prisma.bin.findMany({
      where,
      include: {
        inventoryItems: {
          include: { product: true },
        },
      },
      orderBy: [
        { aisle: 'asc' },
        { row: 'asc' },
        { column: 'asc' },
      ],
    });

    res.json({ success: true, bins });
  } catch (error) {
    logger.error('Error fetching available bins:', error);
    next(error);
  }
};
