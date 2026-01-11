import bcrypt from 'bcrypt';
import prisma from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * Get all users
 * GET /api/users
 * Requires: ADMIN/MANAGER
 */
export const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, role, siteId } = req.query;
    const skip = (page - 1) * limit;

    const where = {
      companyId: req.user.companyId,
    };

    if (role) {
      where.role = role;
    }

    if (siteId) {
      where.siteId = siteId;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          level: true,
          xp: true,
          department: true,
          siteId: true,
          site: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      success: true,
      data: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Error fetching users:', error);
    next(error);
  }
};

/**
 * Get single user by ID
 * GET /api/users/:id
 * Requires: ADMIN/MANAGER or own account
 */
export const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if requesting own account or is admin/manager
    const isOwnAccount = req.user.id === id;
    const isAdminOrManager = ['ADMIN', 'MANAGER'].includes(req.user.role);

    if (!isOwnAccount && !isAdminOrManager) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'You can only view your own account',
      });
    }

    const user = await prisma.user.findFirst({
      where: {
        id,
        companyId: req.user.companyId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        level: true,
        xp: true,
        xpToNextLevel: true,
        avatar: true,
        department: true,
        siteId: true,
        site: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        createdAt: true,
        updatedAt: true,
        stats: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'NotFound',
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    logger.error('Error fetching user:', error);
    next(error);
  }
};

/**
 * Create new user
 * POST /api/users
 * Requires: ADMIN/MANAGER
 * Enforces: User limit
 */
export const createUser = async (req, res, next) => {
  try {
    const { email, password, name, role = 'STAFF', department, siteId } = req.body;

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role,
        department,
        siteId,
        companyId: req.user.companyId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
        siteId: true,
        createdAt: true,
      },
    });

    // Create empty user stats
    await prisma.userStats.create({
      data: {
        userId: user.id,
      },
    });

    logger.info(`User created: ${user.id} (${email}) by ${req.user.email}`);

    res.status(201).json({
      success: true,
      data: user,
      message: 'User created successfully',
    });
  } catch (error) {
    logger.error('Error creating user:', error);
    
    if (error.code === 'P2002') {
      return res.status(409).json({
        success: false,
        error: 'EmailAlreadyExists',
        message: 'A user with this email already exists',
      });
    }
    
    next(error);
  }
};

/**
 * Update user
 * PUT /api/users/:id
 * Requires: ADMIN/MANAGER or own account
 */
export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { email, name, department, siteId } = req.body;

    // Check if requesting own account or is admin/manager
    const isOwnAccount = req.user.id === id;
    const isAdminOrManager = ['ADMIN', 'MANAGER'].includes(req.user.role);

    if (!isOwnAccount && !isAdminOrManager) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'You can only update your own account',
      });
    }

    // Check if user exists and belongs to company
    const existingUser = await prisma.user.findFirst({
      where: {
        id,
        companyId: req.user.companyId,
      },
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: 'NotFound',
        message: 'User not found',
      });
    }

    // Check if new email conflicts
    if (email && email !== existingUser.email) {
      const emailConflict = await prisma.user.findUnique({
        where: { email },
      });

      if (emailConflict) {
        return res.status(409).json({
          success: false,
          error: 'EmailAlreadyExists',
          message: 'A user with this email already exists',
        });
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(email && { email }),
        ...(name && { name }),
        ...(department !== undefined && { department }),
        ...(siteId !== undefined && { siteId }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
        siteId: true,
        updatedAt: true,
      },
    });

    logger.info(`User updated: ${user.id} by ${req.user.email}`);

    res.json({
      success: true,
      data: user,
      message: 'User updated successfully',
    });
  } catch (error) {
    logger.error('Error updating user:', error);
    next(error);
  }
};

/**
 * Update user role
 * PUT /api/users/:id/role
 * Requires: ADMIN only
 */
export const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    // Check if user exists and belongs to company
    const existingUser = await prisma.user.findFirst({
      where: {
        id,
        companyId: req.user.companyId,
      },
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: 'NotFound',
        message: 'User not found',
      });
    }

    // Prevent changing own role
    if (req.user.id === id) {
      return res.status(400).json({
        success: false,
        error: 'ValidationError',
        message: 'You cannot change your own role',
      });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        updatedAt: true,
      },
    });

    logger.info(`User role updated: ${user.id} -> ${role} by ${req.user.email}`);

    res.json({
      success: true,
      data: user,
      message: 'User role updated successfully',
    });
  } catch (error) {
    logger.error('Error updating user role:', error);
    next(error);
  }
};

/**
 * Delete user
 * DELETE /api/users/:id
 * Requires: ADMIN only
 */
export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if user exists and belongs to company
    const existingUser = await prisma.user.findFirst({
      where: {
        id,
        companyId: req.user.companyId,
      },
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: 'NotFound',
        message: 'User not found',
      });
    }

    // Prevent deleting own account
    if (req.user.id === id) {
      return res.status(400).json({
        success: false,
        error: 'ValidationError',
        message: 'You cannot delete your own account',
      });
    }

    await prisma.user.delete({
      where: { id },
    });

    logger.info(`User deleted: ${id} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting user:', error);
    next(error);
  }
};
