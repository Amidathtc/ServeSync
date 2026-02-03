import { prisma } from '../src/config/prisma';
import { paymentService } from '../src/services/payment.service';
import { notificationService } from '../src/services/notification.service';
import { PaymentMethod } from '@prisma/client';

async function testPaymentFlow() {
    console.log('💳 Starting Payment Simulation...');

    try {
        // 1. Setup: Get a user and create a dummy order
        const user = await prisma.user.findFirst({ where: { role: 'CUSTOMER' } });
        if (!user) throw new Error('No customer found. Run seed script first.');

        const restaurant = await prisma.restaurant.findFirst();
        if (!restaurant) throw new Error('No restaurant found.');

        // Clean up old orders for this test
        // await prisma.order.deleteMany({ where: { customerId: user.id } });

        console.log(`👤 Using Customer: ${user.email}`);

        // Create a Mock Order directly via Prisma (skipping service complex validation for speed)
        const order = await prisma.order.create({
            data: {
                customerId: user.id,
                restaurantId: restaurant.id,
                total: 5000, // ₦5,000
                subtotal: 4000,
                deliveryFee: 1000,
                status: 'PENDING',
                items: {
                    create: [] // Empty items for test
                }
            }
        });

        console.log(`📦 Order Created: ${order.id} (₦${order.total})`);

        // 2. Initiate Payment (USSD)
        console.log('\n--- Initiating USSD Payment ---');
        // Using Type Assertion for Enum
        const paymentResult = await paymentService.initiatePayment(order.id, 'USSD' as any, user.id);

        console.log('✅ Payment Initiated:', paymentResult);
        console.log(`📲 User Instructions: "${paymentResult.confirmMessage}"`);

        // Verify Database State (PENDING)
        const pendingPayment = await prisma.payment.findUnique({ where: { orderId: order.id } });
        console.log(`📊 DB Status: ${pendingPayment?.status} (Expected: PENDING)`);

        // 3. Simulate Webhook (Fast Forward)
        console.log('\n--- Simulating Webhook Callback (Mock) ---');
        // Manually calling handleWebhook instead of waiting for setTimeout in service to keep script sync-ish
        if (pendingPayment?.reference) {
            await paymentService.handleWebhook(pendingPayment.reference, 'SUCCESS' as any);
        }

        // 4. Verify Final State
        const finalOrder = await prisma.order.findUnique({ where: { id: order.id } });
        const finalPayment = await prisma.payment.findUnique({ where: { orderId: order.id } });

        console.log(`\n🎉 Final Results:`);
        console.log(`   Order Status:   ${finalOrder?.status} (Expected: CONFIRMED)`);
        console.log(`   Payment Status: ${finalPayment?.status} (Expected: SUCCESS)`);

    } catch (error) {
        console.error('❌ Payment Test Failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Ensure we have environment loaded
import 'dotenv/config';
testPaymentFlow();
