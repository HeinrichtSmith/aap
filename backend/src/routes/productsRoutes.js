import express from 'express';
import { body } from 'express-validator';
import {
  getProducts,
  getProduct,
  getProductBySku,
  getProductByBarcode,
  createProduct,
  updateProduct,
  deleteProduct,
  getLowStockProducts,
  updateInventory,
} from '../controllers/productsController.js';
import { authenticate, authorize, validateRequest } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Validation
const createProductValidation = [
  body('sku').notEmpty().withMessage('SKU required'),
  body('name').notEmpty().withMessage('Product name required'),
  body('category').notEmpty().withMessage('Category required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be positive'),
  body('weight').isFloat({ min: 0 }).withMessage('Weight must be positive'),
  body('barcode').notEmpty().withMessage('Barcode required'),
  body('reorderPoint').isInt({ min: 0 }).withMessage('Reorder point must be positive'),
  body('reorderQuantity').isInt({ min: 0 }).withMessage('Reorder quantity must be positive'),
];

const updateInventoryValidation = [
  body('binId').notEmpty().withMessage('Bin ID required'),
  body('quantity').isInt().withMessage('Quantity must be an integer'),
];

// Read routes (all authenticated users)
router.get('/', getProducts);
router.get('/low-stock', getLowStockProducts);
router.get('/:id', getProduct);
router.get('/sku/:sku', getProductBySku);
router.get('/barcode/:barcode', getProductByBarcode);

// Write routes
router.post(
  '/',
  authorize('ADMIN', 'MANAGER'),
  createProductValidation,
  validateRequest,
  createProduct
);
router.put(
  '/:id',
  authorize('ADMIN', 'MANAGER'),
  updateProduct
);
router.delete(
  '/:id',
  authorize('ADMIN'),
  deleteProduct
);
router.post(
  '/:id/inventory',
  authorize('ADMIN', 'MANAGER', 'RECEIVER'),
  updateInventoryValidation,
  validateRequest,
  updateInventory
);

export default router;
