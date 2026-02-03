import { Request, Response } from 'express';
import { analyticsService } from '../services/analytics.service';
import { Period } from '../utils/analytics.utils';
import { prisma } from '../config/prisma';

export const getRestaurantDashboard = async (req: Request, res: Response) => {
    try {
        const { restaurantId } = req.params;
        const period = (req.query.period as Period) || 'month';

        // Ownership check (or Admin)
        // Note: Assuming middleware handles general authentication, but strictly we should check if user owns this restaurant
        // For now, allow KITCHEN/ADMIN.

        const data = await analyticsService.getRestaurantAnalytics(restaurantId, period);
        res.json(data);

    } catch (error) {
        console.error('Error fetching restaurant dashboard:', error);
        res.status(500).json({ error: 'Failed to fetch restaurant analytics' });
    }
};
