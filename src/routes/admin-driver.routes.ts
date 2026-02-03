import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/admin.middleware';
import * as AdminDriverController from '../controllers/admin-driver.controller';

const router = Router();

router.get('/drivers', authenticate, requireAdmin, AdminDriverController.listDrivers);
router.put('/drivers/:id/verify', authenticate, requireAdmin, AdminDriverController.verifyDriver);

export default router;
