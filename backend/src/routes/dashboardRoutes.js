import express from 'express';
import {
  getDashboardStats,
  getRecentActivity,
} from '../controllers/dashboardController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Dashboard stats
router.get('/stats', getDashboardStats);
router.get('/activity', getRecentActivity);

export default router;