import { Request, Response } from 'express';
import { z } from 'zod';
import { paymentService } from '../services/payment.service';
import { PaymentMethod, PaymentStatus } from '@prisma/client';

/**
 * Initiate Payment
 * POST /payments/initiate
 */
export const initiatePayment = async (req: Request, res: Response) => {
    try {
        const schema = z.object({
            orderId: z.string().min(1, 'Order ID is required'),
            method: z.enum(['CARD', 'USSD', 'TRANSFER', 'WALLET', 'CASH']),
        });

        const { orderId, method } = schema.parse(req.body);
        // Using 'id' based on other controllers (driver.controller.ts)
        const userId = (req as any).user.id;

        const result = await paymentService.initiatePayment(
            orderId,
            method as PaymentMethod,
            userId
        );

        res.json({
            success: true,
            data: result
        });
    } catch (error: any) {
        console.error('Payment initiation error:', error);
        res.status(400).json({
            success: false,
            error: error.message || 'Payment initiation failed'
        });
    }
};

/**
 * Payment Webhook (Mock)
 * POST /payments/webhook
 */
export const handleWebhook = async (req: Request, res: Response) => {
    try {
        const { reference, status } = req.body;

        if (!reference || !status) {
            return res.status(400).json({ error: 'Missing reference or status' });
        }

        await paymentService.handleWebhook(reference, status as PaymentStatus);

        res.json({ received: true });
    } catch (error: any) {
        console.error('Webhook error:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
};

/**
 * Get Payment Status
 * GET /payments/:orderId
 */
export const getPaymentStatus = async (req: Request, res: Response) => {
    try {
        // Implementation omitted for brevity in MVP, but controller entry needed
        res.json({ status: 'PENDING', message: 'Not implemented yet' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch status' });
    }
};
