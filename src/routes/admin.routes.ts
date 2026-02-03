import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/admin.middleware';
import * as AdminController from '../controllers/admin.controller';

const router = Router();

// Dashboard Overview (Combined stats)
router.get('/dashboard', authenticate, requireAdmin, AdminController.getDashboardOverview);

// Detailed Analytics
router.get('/revenue', authenticate, requireAdmin, AdminController.getRevenueAnalytics);
router.get('/orders', authenticate, requireAdmin, AdminController.getOrderAnalytics);
router.get('/restaurants/top', authenticate, requireAdmin, AdminController.getTopRestaurants);

export default router;
