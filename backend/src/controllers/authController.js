import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../config/database.js';
import logger from '../utils/logger.js';

// Register new user
export const register = async (req, res, next) => {
  try {
    const { email, password, name, role, department, avatar } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'User with this email already exists',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with stats
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: role || 'STAFF',
        department: department || 'Warehouse',
        avatar: avatar || '👤',
        stats: {
          create: {},
        },
      },
      include: { stats: true },
    });

    // Generate token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Log activity
    await prisma.activity.create({
      data: {
        userId: user.id,
        type: 'USER_CREATED',
        entityType: 'User',
        entityId: user.id,
        description: `New user ${name} registered`,
      },
    });

    logger.info(`User registered: ${email}`);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        level: user.level,
        xp: user.xp,
        avatar: user.avatar,
        department: user.department,
        stats: user.stats,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Login user
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: { stats: true },
    });

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid credentials',
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid credentials',
      });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Log activity
    await prisma.activity.create({
      data: {
        userId: user.id,
        type: 'LOGIN',
        entityType: 'User',
        entityId: user.id,
        description: `${user.name} logged in`,
      },
    });

    logger.info(`User logged in: ${email}`);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        level: user.level,
        xp: user.xp,
        xpToNextLevel: user.xpToNextLevel,
        avatar: user.avatar,
        department: user.department,
        stats: user.stats,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get current user
export const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { 
        stats: true,
        achievements: {
          include: { achievement: true },
        },
      },
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        level: user.level,
        xp: user.xp,
        xpToNextLevel: user.xpToNextLevel,
        avatar: user.avatar,
        department: user.department,
        stats: user.stats,
        achievements: user.achievements.map(ua => ua.achievement),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Logout
export const logout = async (req, res, next) => {
  try {
    // Log activity
    await prisma.activity.create({
      data: {
        userId: req.user.id,
        type: 'LOGOUT',
        entityType: 'User',
        entityId: req.user.id,
        description: `${req.user.name} logged out`,
      },
    });

    logger.info(`User logged out: ${req.user.email}`);

    res.json({ message: 'Logout successful' });
  } catch (error) {
    next(error);
  }
};
