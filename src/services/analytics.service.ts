import { prisma } from '../config/prisma';
import {
    getDateRange,
    Period,
    toLagosTime,
    calculatePercentage,
    calculateGrowthRate,
    formatNaira,
    getGroupByFormat
} from '../utils/analytics.utils';
import { subDays, subMonths, format } from 'date-fns';

export class AnalyticsService {
    /**
     * Get platform-wide revenue analytics (Admin)
     */
    async getPlatformRevenue(period: Period, groupBy: 'day' | 'week' | 'month' = 'day', startDate?: Date, endDate?: Date) {
        const dateRange = getDateRange(period, startDate, endDate);
        const { start, end } = dateRange;

        const currentRevenue = await prisma.payment.aggregate({
            where: {
                status: 'SUCCESS',
                createdAt: { gte: start, lte: end }
            },
            _sum: { amount: true },
            _count: { id: true }
        });

        const duration = end.getTime() - start.getTime();
        const prevStart = new Date(start.getTime() - duration);
        const prevEnd = new Date(end.getTime() - duration);

        const prevRevenue = await prisma.payment.aggregate({
            where: {
                status: 'SUCCESS',
                createdAt: { gte: prevStart, lte: prevEnd }
            },
            _sum: { amount: true }
        });

        const revenue = currentRevenue._sum.amount || 0;
        const totalOrders = currentRevenue._count.id || 0;
        const prevAmount = prevRevenue._sum.amount || 0;
        const growth = calculateGrowthRate(revenue, prevAmount);

        const payments = await prisma.payment.findMany({
            where: {
                status: 'SUCCESS',
                createdAt: { gte: start, lte: end }
            },
            select: {
                amount: true,
                createdAt: true,
                paymentMethod: true
            },
            orderBy: { createdAt: 'asc' }
        });

        const chartData: Record<string, { revenue: number, orders: number }> = {};

        payments.forEach(payment => {
            const date = toLagosTime(payment.createdAt);
            const key = format(date, getGroupByFormat(groupBy));

            if (!chartData[key]) {
                chartData[key] = { revenue: 0, orders: 0 };
            }

            chartData[key].revenue += payment.amount;
            chartData[key].orders += 1;
        });

        const byPaymentMethod: Record<string, { count: number, amount: number }> = {};
        payments.forEach(payment => {
            const method = payment.paymentMethod;
            if (!byPaymentMethod[method]) {
                byPaymentMethod[method] = { count: 0, amount: 0 };
            }
            byPaymentMethod[method].count += 1;
            byPaymentMethod[method].amount += payment.amount;
        });

        return {
            overview: {
                totalRevenue: revenue,
                formattedRevenue: formatNaira(revenue),
                totalOrders,
                averageOrderValue: totalOrders > 0 ? revenue / totalOrders : 0,
                growthRate: growth,
                period
            },
            chart: Object.entries(chartData).map(([date, data]) => ({
                date,
                ...data
            })),
            paymentMethods: Object.entries(byPaymentMethod).map(([method, data]) => ({
                method,
                ...data
            }))
        };
    }

    /**
     * Get platform-wide order stats (Admin)
     */
    async getPlatformOrders(period: Period) {
        const { start, end } = getDateRange(period);

        const orders = await prisma.order.findMany({
            where: { createdAt: { gte: start, lte: end } },
            select: {
                status: true,
                delivery: { select: { status: true } }
            }
        });

        const total = orders.length;
        const byStatus = orders.reduce((acc, order) => {
            acc[order.status] = (acc[order.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        let deliveryCount = 0;
        let pickupCount = 0;

        orders.forEach(order => {
            if (order.delivery) deliveryCount++;
            else pickupCount++;
        });

        return {
            total,
            byStatus,
            fulfillment: {
                delivery: deliveryCount,
                pickup: pickupCount,
                deliveryRate: calculatePercentage(deliveryCount, total)
            }
        };
    }

    /**
     * Get top performing restaurants (Admin)
     */
    async getTopRestaurants(limit: number = 5) {
        const restaurants = await prisma.order.groupBy({
            by: ['restaurantId'],
            where: { status: { in: ['DELIVERED'] } },
            _sum: { total: true },
            _count: { id: true },
            orderBy: { _sum: { total: 'desc' } },
            take: limit
        });

        const results = await Promise.all(restaurants.map(async (r) => {
            const details = await prisma.restaurant.findUnique({
                where: { id: r.restaurantId },
                select: { name: true, image: true }
            });

            return {
                id: r.restaurantId,
                name: details?.name || 'Unknown',
                image: details?.image,
                revenue: r._sum.total || 0,
                orders: r._count.id || 0
            };
        }));

        return results;
    }

    /**
     * Get Restaurant Analytics (Owner View)
     */
    async getRestaurantAnalytics(restaurantId: string, period: Period, groupBy: 'day' | 'week' | 'month' = 'day') {
        const { start, end } = getDateRange(period);

        // Revenue & Orders
        const payments = await prisma.payment.findMany({
            where: {
                status: 'SUCCESS',
                order: { restaurantId },
                createdAt: { gte: start, lte: end }
            },
            include: { order: true }
        });

        const revenue = payments.reduce((sum, p) => sum + p.amount, 0);
        const totalOrders = payments.length;

        // Top Items
        const topItems = await prisma.orderItem.groupBy({
            by: ['menuItemId'],
            where: {
                order: {
                    restaurantId,
                    status: 'DELIVERED', // Only completed orders
                    createdAt: { gte: start, lte: end },
                    payment: {
                        status: 'SUCCESS'
                    }
                }
            },
            _sum: { quantity: true, price: true },
            orderBy: { _sum: { quantity: 'desc' } },
            take: 5
        });

        const enrichedTopItems = await Promise.all(topItems.map(async (item) => {
            const details = await prisma.menuItem.findUnique({
                where: { id: item.menuItemId },
                select: { name: true }
            });
            return {
                id: item.menuItemId,
                name: details?.name || 'Unknown',
                quantity: item._sum.quantity || 0,
                revenue: (item._sum.price || 0) * (item._sum.quantity || 1) // Approximation
            };
        }));

        return {
            revenue: {
                total: revenue,
                formatted: formatNaira(revenue),
                orders: totalOrders
            },
            topItems: enrichedTopItems
        };
    }

    /**
     * Get Customer Analytics (Personal View)
     */
    async getCustomerAnalytics(userId: string) {
        const orders = await prisma.order.findMany({
            where: { customerId: userId },
            include: {
                restaurant: { select: { name: true } },
                payment: true
            },
            orderBy: { createdAt: 'desc' }
        });

        const totalSpent = orders.reduce((sum, o) => sum + (o.payment?.amount || 0), 0);
        const totalOrders = orders.length;

        return {
            stats: {
                totalOrders,
                totalSpent,
                formattedSpent: formatNaira(totalSpent),
                averageOrderValue: totalOrders > 0 ? totalSpent / totalOrders : 0
            },
            orders: orders.map(o => ({
                id: o.id,
                restaurant: o.restaurant.name,
                date: o.createdAt,
                total: o.total,
                status: o.status
            }))
        };
    }
}

export const analyticsService = new AnalyticsService();
