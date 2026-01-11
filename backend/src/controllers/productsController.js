import prisma from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * Get all products with filtering and pagination
 * GET /api/products
 * Requires: All authenticated users
 */
export const getProducts = async (req, res, next) => {
  try {
    const { 
      category, 
      search, 
      page = 1, 
      limit = 50,
      siteId
    } = req.query;

    const where = {
      companyId: req.user.companyId,
    };

    // Filter by user's site if not admin
    if (req.user.role !== 'ADMIN' && req.user.siteId) {
      where.siteId = req.user.siteId;
    } else if (siteId) {
      // Admin can filter by specific site
      where.siteId = siteId;
    }

    if (category) where.category = category;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        inventoryItems: {
          include: { bin: true },
          // Filter inventory by site if not admin
          ...(req.user.role !== 'ADMIN' && req.user.siteId && {
            where: { bin: { code: { contains: req.user.siteId } } },
          }),
        },
      },
      orderBy: { sku: 'asc' },
      skip: (page - 1) * limit,
      take: parseInt(limit),
    });

    const total = await prisma.product.count({ where });

    res.json({
      success: true,
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Error fetching products:', error);
    next(error);
  }
};

/**
 * Get single product
 * GET /api/products/:id
 * Requires: All authenticated users
 */
export const getProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    const where = {
      id,
      companyId: req.user.companyId,
    };

    // Non-admin users can only access products at their site
    if (req.user.role !== 'ADMIN' && req.user.siteId) {
      where.siteId = req.user.siteId;
    }

    const product = await prisma.product.findFirst({
      where,
      include: {
        inventoryItems: {
          include: { bin: true },
          ...(req.user.role !== 'ADMIN' && req.user.siteId && {
            where: { bin: { code: { contains: req.user.siteId } } },
          }),
        },
      },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'NotFound',
        message: 'Product not found',
      });
    }

    res.json({ success: true, product });
  } catch (error) {
    logger.error('Error fetching product:', error);
    next(error);
  }
};

/**
 * Get product by SKU
 * GET /api/products/sku/:sku
 * Requires: All authenticated users
 */
export const getProductBySku = async (req, res, next) => {
  try {
    const { sku } = req.params;

    const where = {
      sku: sku.toUpperCase(),
      companyId: req.user.companyId,
    };

    // Non-admin users can only access products at their site
    if (req.user.role !== 'ADMIN' && req.user.siteId) {
      where.siteId = req.user.siteId;
    }

    const product = await prisma.product.findFirst({
      where,
      include: {
        inventoryItems: {
          include: { bin: true },
        },
      },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'NotFound',
        message: 'Product not found',
      });
    }

    res.json({ success: true, product });
  } catch (error) {
    logger.error('Error fetching product by SKU:', error);
    next(error);
  }
};

/**
 * Get product by barcode
 * GET /api/products/barcode/:barcode
 * Requires: All authenticated users
 */
export const getProductByBarcode = async (req, res, next) => {
  try {
    const { barcode } = req.params;

    const where = {
      barcode,
      companyId: req.user.companyId,
    };

    // Non-admin users can only access products at their site
    if (req.user.role !== 'ADMIN' && req.user.siteId) {
      where.siteId = req.user.siteId;
    }

    const product = await prisma.product.findFirst({
      where,
      include: {
        inventoryItems: {
          include: { bin: true },
        },
      },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'NotFound',
        message: 'Product not found',
      });
    }

    res.json({ success: true, product });
  } catch (error) {
    logger.error('Error fetching product by barcode:', error);
    next(error);
  }
};

/**
 * Create product
 * POST /api/products
 * Requires: ADMIN/MANAGER
 */
export const createProduct = async (req, res, next) => {
  try {
    const {
      sku,
      name,
      description,
      category,
      price,
      weight,
      dimensions,
      image,
      barcode,
      reorderPoint,
      reorderQuantity,
      supplier,
      siteId,
    } = req.body;

    // If siteId provided, verify it belongs to user's company
    if (siteId) {
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
    }

    const product = await prisma.product.create({
      data: {
        sku: sku.toUpperCase(),
        name,
        description,
        category,
        price: parseFloat(price),
        weight: parseFloat(weight),
        dimensions,
        image,
        barcode,
        reorderPoint: parseInt(reorderPoint),
        reorderQuantity: parseInt(reorderQuantity),
        supplier,
        companyId: req.user.companyId,
        siteId: siteId || req.user.siteId,
      },
    });

    logger.info(`Product created: ${sku} by ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product,
    });
  } catch (error) {
    logger.error('Error creating product:', error);
    next(error);
  }
};

/**
 * Update product
 * PUT /api/products/:id
 * Requires: ADMIN/MANAGER
 */
export const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if product exists and belongs to company
    const existingProduct = await prisma.product.findFirst({
      where: {
        id,
        companyId: req.user.companyId,
      },
    });

    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        error: 'NotFound',
        message: 'Product not found',
      });
    }

    const product = await prisma.product.update({
      where: { id },
      data: req.body,
    });

    logger.info(`Product updated: ${product.sku} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Product updated successfully',
      product,
    });
  } catch (error) {
    logger.error('Error updating product:', error);
    next(error);
  }
};

/**
 * Delete product
 * DELETE /api/products/:id
 * Requires: ADMIN only
 */
export const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if product exists and belongs to company
    const existingProduct = await prisma.product.findFirst({
      where: {
        id,
        companyId: req.user.companyId,
      },
    });

    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        error: 'NotFound',
        message: 'Product not found',
      });
    }

    // Check if product has inventory
    const inventoryCount = await prisma.inventoryItem.count({
      where: { productId: id },
    });

    if (inventoryCount > 0) {
      return res.status(400).json({
        success: false,
        error: 'HasInventory',
        message: 'Cannot delete product with existing inventory. Please remove inventory first.',
      });
    }

    // Check if product is referenced in orders
    const orderItemCount = await prisma.orderItem.count({
      where: { productId: id },
    });

    if (orderItemCount > 0) {
      return res.status(400).json({
        success: false,
        error: 'HasOrders',
        message: 'Cannot delete product referenced in orders.',
      });
    }

    await prisma.product.delete({
      where: { id },
    });

    logger.info(`Product deleted: ${id} (${existingProduct.sku}) by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting product:', error);
    next(error);
  }
};

/**
 * Get low stock products
 * GET /api/products/low-stock
 * Requires: ADMIN/MANAGER
 */
export const getLowStockProducts = async (req, res, next) => {
  try {
    const where = {
      companyId: req.user.companyId,
    };

    // Filter by user's site if not admin
    if (req.user.role !== 'ADMIN' && req.user.siteId) {
      where.siteId = req.user.siteId;
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        inventoryItems: {
          include: { bin: true },
        },
      },
    });

    const lowStockProducts = products.filter(product => {
      const totalStock = product.inventoryItems.reduce((sum, item) => sum + item.quantity, 0);
      return totalStock <= product.reorderPoint;
    });

    res.json({ 
      success: true,
      products: lowStockProducts,
    });
  } catch (error) {
    logger.error('Error fetching low stock products:', error);
    next(error);
  }
};

/**
 * Update inventory
 * POST /api/products/:id/inventory
 * Requires: ADMIN/MANAGER/RECEIVER
 */
export const updateInventory = async (req, res, next) => {
  try {
    const { binId, quantity, adjustmentReason } = req.body;
    const { id } = req.params;

    // Verify product exists and belongs to company
    const product = await prisma.product.findFirst({
      where: {
        id,
        companyId: req.user.companyId,
      },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'NotFound',
        message: 'Product not found',
      });
    }

    // If not admin, verify bin belongs to user's site
    if (req.user.role !== 'ADMIN') {
      const bin = await prisma.bin.findUnique({
        where: { id: binId },
      });

      if (!bin || (req.user.siteId && !bin.code.includes(req.user.siteId))) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'Cannot access bins at other sites',
        });
      }
    }

    // Validate quantity
    const newQuantity = parseInt(quantity);
    if (newQuantity < 0) {
      return res.status(400).json({
        success: false,
        error: 'InvalidQuantity',
        message: 'Quantity cannot be negative',
      });
    }

    // Find or create inventory item
    let inventoryItem = await prisma.inventoryItem.findUnique({
      where: {
        productId_binId: {
          productId: id,
          binId,
        },
      },
      include: { product: true },
    });

    if (inventoryItem) {
      inventoryItem = await prisma.inventoryItem.update({
        where: { id: inventoryItem.id },
        data: { quantity: newQuantity },
      });
    } else {
      inventoryItem = await prisma.inventoryItem.create({
        data: {
          productId: id,
          binId,
          quantity: newQuantity,
        },
        include: { product: true },
      });
    }

    // Log activity
    await prisma.activity.create({
      data: {
        userId: req.user.id,
        type: 'INVENTORY_ADJUSTED',
        entityType: 'InventoryItem',
        entityId: inventoryItem.id,
        description: `Inventory adjusted for ${inventoryItem.product.sku}`,
        metadata: {
          binId,
          quantity: newQuantity,
          adjustmentReason,
        },
      },
    });

    logger.info(`Inventory updated: ${inventoryItem.product.sku} in bin ${binId} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Inventory updated successfully',
      inventoryItem,
    });
  } catch (error) {
    logger.error('Error updating inventory:', error);
    next(error);
  }
};
