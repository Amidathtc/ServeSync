import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { driverService } from '../services/driver.service';

/**
 * Admin Driver Controller
 * Handles admin management of drivers
 */

export const listDrivers = async (req: Request, res: Response) => {
    try {
        const { status } = req.query;

        const where: any = {};
        if (status) {
            where.status = status;
        }

        const drivers = await prisma.driverProfile.findMany({
            where,
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                        phone: true,
                        avatar: true
                    }
                },
                _count: {
                    select: { deliveries: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(drivers);
    } catch (error) {
        console.error('Error listing drivers:', error);
        res.status(500).json({ error: 'Failed to list drivers' });
    }
};

export const verifyDriver = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const adminId = (req as any).user.id;

        if (!['VERIFIED', 'REJECTED', 'SUSPENDED'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const driver = await driverService.verifyDriver(adminId, id, status);
        res.json(driver);

    } catch (error) {
        console.error('Error verifying driver:', error);
        res.status(500).json({ error: 'Failed to verify driver' });
    }
};
