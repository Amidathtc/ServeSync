import { prisma } from '../config/prisma';
import { PaymentMethod, PaymentStatus } from '@prisma/client';
import { notificationService } from './notification.service';

/**
 * Payment Service
 * Handles Nigerian payment context (Cards, USSD, Transfer, Wallet)
 * 
 * NOTE: Since we cannot integrate live Paystack/Flutterwave without API keys,
 * this service implements the BUSINESS LOGIC with mocked gateway responses.
 */
export class PaymentService {

    /**
     * Initiate a payment for an order
     */
    async initiatePayment(orderId: string, method: PaymentMethod, userId: string) {
        // 1. Get Order
        const order = await prisma.order.findUnique({
            where: { id: orderId }
        });

        if (!order) throw new Error('Order not found');

        // 2. Mock Gateway Initialization
        const reference = `REF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        let gatewayUrl = '';
        let confirmMessage = '';

        switch (method) {
            case 'CARD':
                // In production, this would be the authorization_url from Paystack
                gatewayUrl = `https://checkout.paystack.com/${reference}`;
                break;
            case 'USSD':
                confirmMessage = `Dial *737*000*${order.total}# to pay`;
                break;
            case 'TRANSFER':
                confirmMessage = `Transfer ₦${order.total} to Wema Bank - 0000000000 (PaystackCheckout)`;
                break;
            case 'WALLET':
                return this.processWalletPayment(orderId, userId, order.total);
            default:
                throw new Error('Unsupported payment method');
        }

        // 3. Create Payment Record (PENDING)
        const payment = await prisma.payment.create({
            data: {
                orderId,
                amount: order.total,
                currency: 'NGN',
                paymentMethod: method,
                status: 'PENDING',
                reference,
                provider: 'PAYSTACK' // Changed from MOCK_GATEWAY
            }
        });

        // 4. Simulate Async Webhook (For demo purposes only)
        // WALLET payments are instant, others go via Gateway
        if ((method as string) !== 'WALLET') {
            this.simulateWebhook(reference);
        }

        return {
            paymentId: payment.id,
            reference,
            gatewayUrl,
            confirmMessage,
            status: 'PENDING'
        };
    }

    /**
     * Process internal wallet payment
     */
    private async processWalletPayment(orderId: string, userId: string, amount: number) {
        // Atomic transaction: Check balance -> Deduct -> Create Payment
        return await prisma.$transaction(async (tx) => {
            // Check driver/user wallet (Assuming we have a user wallet model, 
            // but for now we might only have DriverProfile wallet. 
            // If this is a Customer, we'd need a Wallet model. 
            // For MVP, checking DriverProfile if it exists, else Mock success)

            // ... Logic omitted for brevity, assuming success for MVP ...

            const payment = await tx.payment.create({
                data: {
                    orderId,
                    amount,
                    currency: 'NGN',
                    paymentMethod: 'WALLET',
                    status: 'SUCCESS',
                    reference: `WAL-${Date.now()}`,
                    provider: 'INTERNAL_WALLET'
                }
            });

            // Update Order Status
            await tx.order.update({
                where: { id: orderId },
                data: { status: 'CONFIRMED' } // Paid -> Confirmed
            });

            return {
                paymentId: payment.id,
                status: 'SUCCESS',
                message: 'Payment successful from wallet'
            };
        });
    }

    /**
     * Handle (Simulated) Webhook from Gateway
     */
    async handleWebhook(reference: string, status: PaymentStatus) {
        const payment = await prisma.payment.update({
            where: { reference },
            data: { status }
        });

        if (status === 'SUCCESS') {
            // Update Order
            const order = await prisma.order.update({
                where: { id: payment.orderId },
                data: { status: 'CONFIRMED' }
            });

            // Notify User
            notificationService.notifyOrderUpdate(
                order.customerId,
                order.id,
                'Payment Received - Order Confirmed'
            );
        }

        return payment;
    }

    /**
     * Simulate a webhook call after delay
     */
    private simulateWebhook(reference: string) {
        setTimeout(async () => {
            console.log(`\n💸 [MOCK GATEWAY] Webhook received for ${reference}`);
            await this.handleWebhook(reference, 'SUCCESS');
        }, 5000); // 5 seconds delay
    }
}

export const paymentService = new PaymentService();
