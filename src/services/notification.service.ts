/**
 * Notification Service
 * Handles multi-channel alerts (Push, Email, In-App).
 * 
 * For MVP/Portfolio, this is a STUB implementation that logs to console.
 * In production, this would integrate with:
 * - Firebase Cloud Messaging (FCM) for Push
 * - SendGrid/AWS SES for Email
 */
export class NotificationService {

    /**
     * Send Push Notification to a specific user
     * @param userId Target User ID
     * @param title Notification Title
     * @param body Notification Body
     * @param data Optional payload data
     */
    async sendPush(userId: string, title: string, body: string, data?: any) {
        // 1. Look up user's device token from DB (skipped for stub)
        // 2. Send via FCM

        console.log(`\n📲 [MOCK PUSH] To User: ${userId}`);
        console.log(`   Title: ${title}`);
        console.log(`   Body:  ${body}`);
        if (data) console.log('   Data:', JSON.stringify(data));
        console.log('-----------------------------------');
    }

    /**
     * Send Email Notification
     * @param email Target Email
     * @param subject Email Subject
     * @param content Email Body (HTML/Text)
     */
    async sendEmail(email: string, subject: string, content: string) {
        console.log(`\n📧 [MOCK EMAIL] To: ${email}`);
        console.log(`   Subject: ${subject}`);
        console.log(`   Content Preview: ${content.substring(0, 50)}...`);
        console.log('-----------------------------------');
    }

    /**
     * Send generic order update notification
     */
    async notifyOrderUpdate(userId: string, orderId: string, status: string) {
        const title = `Order Update #${orderId.substring(0, 6)}`;
        const body = `Your order status is now: ${status}`;

        await this.sendPush(userId, title, body, { orderId, status });
    }
}

export const notificationService = new NotificationService();
