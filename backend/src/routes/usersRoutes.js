import express from 'express';
import { 
  getAllUsers, 
  getUserById, 
  createUser, 
  updateUser, 
  updateUserRole, 
  deleteUser 
} from '../controllers/usersController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { enforceUserLimit } from '../middleware/planEnforcement.js';
import { 
  createUserValidation, 
  updateUserValidation, 
  updateRoleValidation 
} from '../utils/validators.js';
import { validateRequest } from '../middleware/errorHandler.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/users
 * @desc    Get all users for user's company
 * @access  Private (ADMIN/MANAGER)
 */
router.get(
  '/', 
  authorize('ADMIN', 'MANAGER'),
  getAllUsers
);

/**
 * @route   GET /api/users/:id
 * @desc    Get single user by ID
 * @access  Private (ADMIN/MANAGER or own account)
 */
router.get(
  '/:id',
  authenticate,
  getUserById
);

/**
 * @route   POST /api/users
 * @desc    Create new user
 * @access  Private (ADMIN/MANAGER)
 */
router.post(
  '/', 
  authorize('ADMIN', 'MANAGER'),
  enforceUserLimit,
  createUserValidation,
  validateRequest,
  createUser
);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user
 * @access  Private (ADMIN/MANAGER or own account)
 */
router.put(
  '/:id',
  authenticate,
  updateUserValidation,
  validateRequest,
  updateUser
);

/**
 * @route   PUT /api/users/:id/role
 * @desc    Update user role
 * @access  Private (ADMIN only)
 */
router.put(
  '/:id/role',
  authorize('ADMIN'),
  updateRoleValidation,
  validateRequest,
  updateUserRole
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user
 * @access  Private (ADMIN only)
 */
router.delete(
  '/:id',
  authorize('ADMIN'),
  deleteUser
);

export default router;
