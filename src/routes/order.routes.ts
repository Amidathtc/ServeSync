import { Router } from 'express';
import * as OrderController from '../controllers/order.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

// Customer routes
// Place order - any authenticated user (typically CUSTOMER)
router.post('/', authenticate, OrderController.placeOrder);

// Get my orders - any authenticated user
router.get('/', authenticate, OrderController.getMyOrders);

// Get order details - authenticated users who own the order or restaurant
router.get('/:id', authenticate, OrderController.getOrderDetails);

// Cancel order - authenticated users (permissions checked in service)
router.delete('/:id', authenticate, OrderController.cancelOrder);

// Kitchen routes
// Get restaurant orders - KITCHEN or ADMIN only
router.get('/restaurant/:restaurantId', authenticate, authorize(['KITCHEN', 'ADMIN']), OrderController.getRestaurantOrders);

// Update order status - KITCHEN or ADMIN only
router.patch('/:id/status', authenticate, authorize(['KITCHEN', 'ADMIN']), OrderController.updateStatus);

export default router;
