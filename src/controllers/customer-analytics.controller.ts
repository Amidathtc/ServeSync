import { Request, Response } from 'express';
import { analyticsService } from '../services/analytics.service';

export const getMyAnalytics = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const data = await analyticsService.getCustomerAnalytics(userId);
        res.json(data);
    } catch (error) {
        console.error('Error fetching customer analytics:', error);
        res.status(500).json({ error: 'Failed to fetch customer analytics' });
    }
};
