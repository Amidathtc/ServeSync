import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import * as PaymentController from '../controllers/payment.controller';

const router = Router();

/**
 * Payment Routes
 */

// Initiate payment
router.post('/initiate', authenticate, PaymentController.initiatePayment);

// Get payment status
router.get('/:orderId', authenticate, PaymentController.getPaymentStatus);

// Webhook endpoint (Public)
router.post('/webhook', PaymentController.handleWebhook);

export default router;
