import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import * as CustomerAnalyticsController from '../controllers/customer-analytics.controller';

const router = Router();

// Customer Analytics
router.get('/me/analytics', authenticate, CustomerAnalyticsController.getMyAnalytics);

export default router;
