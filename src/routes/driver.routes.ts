import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import * as DriverController from '../controllers/driver.controller';

const router = Router();

// Registration & Profile
router.post('/register', authenticate, DriverController.register);
router.get('/me', authenticate, DriverController.getMyProfile);

// Status & Location
router.put('/me/status', authenticate, DriverController.updateStatus);
router.put('/me/location', authenticate, DriverController.updateLocation);

// Orders
router.get('/orders/available', authenticate, DriverController.getAvailableOrders);
router.post('/orders/:id/accept', authenticate, DriverController.acceptOrder);
router.put('/orders/:id/status', authenticate, DriverController.updateDeliveryStatus);

// Earnings (Placeholder)
router.get('/earnings', authenticate, DriverController.getEarnings);

export default router;
