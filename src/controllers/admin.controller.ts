import { Request, Response } from 'express';
import { analyticsService } from '../services/analytics.service';
import { Period } from '../utils/analytics.utils';

/**
 * Admin Dashboard Controller
 * Handlers for platform-wide analytics
 */

export const getDashboardOverview = async (req: Request, res: Response) => {
    try {
        const period = (req.query.period as Period) || 'month';
        const groupBy = (req.query.groupBy as 'day' | 'week' | 'month') || 'day';

        const [revenue, orders, topRestaurants] = await Promise.all([
            analyticsService.getPlatformRevenue(period, groupBy),
            analyticsService.getPlatformOrders(period),
            analyticsService.getTopRestaurants(5)
        ]);

        res.json({
            revenue,
            orders,
            topRestaurants
        });
    } catch (error) {
        console.error('Error fetching admin dashboard:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
};

export const getRevenueAnalytics = async (req: Request, res: Response) => {
    try {
        const period = (req.query.period as Period) || 'month';
        const groupBy = (req.query.groupBy as 'day' | 'week' | 'month') || 'day';

        const data = await analyticsService.getPlatformRevenue(period, groupBy);
        res.json(data);
    } catch (error) {
        console.error('Error fetching revenue analytics:', error);
        res.status(500).json({ error: 'Failed to fetch revenue analytics' });
    }
};

export const getOrderAnalytics = async (req: Request, res: Response) => {
    try {
        const period = (req.query.period as Period) || 'month';

        const data = await analyticsService.getPlatformOrders(period);
        res.json(data);
    } catch (error) {
        console.error('Error fetching order analytics:', error);
        res.status(500).json({ error: 'Failed to fetch order analytics' });
    }
};

export const getTopRestaurants = async (req: Request, res: Response) => {
    try {
        const limit = parseInt(req.query.limit as string) || 5;
        const data = await analyticsService.getTopRestaurants(limit);
        res.json(data);
    } catch (error) {
        console.error('Error fetching top restaurants:', error);
        res.status(500).json({ error: 'Failed to fetch top restaurants' });
    }
};
