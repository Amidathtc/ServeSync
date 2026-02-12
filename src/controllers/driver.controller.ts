import { Request, Response } from 'express';
import { driverService } from '../services/driver.service';
import { deliveryService } from '../services/delivery.service';
import { VehicleType } from '@prisma/client';

/**
 * Driver Controller
 * Handles all driver-facing operations
 */

export const register = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { vehicleType, vehiclePlate, licenseNumber } = req.body;

        // Validation
        if (!vehicleType || !vehiclePlate || !licenseNumber) {
            return res.status(400).json({ error: 'Missing registration details' });
        }

        if (!Object.values(VehicleType).includes(vehicleType)) {
            return res.status(400).json({ error: 'Invalid vehicle type' });
        }

        const profile = await driverService.createProfile({
            userId,
            vehicleType,
            vehiclePlate,
            licenseNumber
        });

        res.status(201).json(profile);
    } catch (error: any) {
        console.error('Error registering driver:', error);
        if (error.message === 'Driver profile already exists') {
            return res.status(409).json({ error: error.message });
        }
        res.status(500).json({ error: 'Failed to register driver' });
    }
};

export const getMyProfile = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const profile = await driverService.getProfile(userId);

        if (!profile) {
            return res.status(404).json({ error: 'Driver profile not found' });
        }

        res.json(profile);
    } catch (error) {
        console.error('Error fetching driver profile:', error);
        res.status(500).json({ error: 'Failed to fetch driver profile' });
    }
};

export const updateStatus = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { isOnline, lat, lng } = req.body;

        if (isOnline === undefined) {
            return res.status(400).json({ error: 'isOnline status is required' });
        }

        const profile = await driverService.updateStatus({
            userId,
            isOnline,
            lat,
            lng
        });

        res.json(profile);

    } catch (error) {
        console.error('Error updating driver status:', error);
        res.status(500).json({ error: 'Failed to update status' });
    }
};

export const updateLocation = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { lat, lng } = req.body;

        if (lat === undefined || lng === undefined) {
            return res.status(400).json({ error: 'Location coordinates required' });
        }

        const profile = await driverService.updateLocation(userId, lat, lng);
        res.json({ success: true, timestamp: profile.lastLocationUpdate });

    } catch (error) {
        console.error('Error updating location:', error);
        res.status(500).json({ error: 'Failed to update location' });
    }
};

export const getAvailableOrders = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;

        // Get driver's current location from profile
        const profile = await driverService.getProfile(userId);
        if (!profile || !profile.currentLat || !profile.currentLng) {
            return res.status(400).json({ error: 'Driver location not set. Please go online.' });
        }

        const orders = await deliveryService.getAvailableOrdersForDriver(
            profile.currentLat,
            profile.currentLng,
            10 // 10km radius
        );

        res.json(orders);
    } catch (error) {
        console.error('Error fetching available orders:', error);
        res.status(500).json({ error: 'Failed to fetch available orders' });
    }
};

export const acceptOrder = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { id: deliveryId } = req.params;

        // Get driver profile ID
        const profile = await driverService.getProfile(userId);
        if (!profile) {
            return res.status(404).json({ error: 'Driver profile not found' });
        }

        // Assign driver
        const io = req.app.get('io');
        const delivery = await deliveryService.assignDriver(deliveryId, profile.id, io);

        res.json({
            success: true,
            message: 'Order accepted successfully',
            delivery
        });

    } catch (error: any) {
        console.error('Error accepting order:', error);
        if (error.message.includes('not available')) {
            return res.status(409).json({ error: 'Order is no longer available' });
        }
        res.status(500).json({ error: 'Failed to accept order' });
    }
};

export const updateDeliveryStatus = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { id: deliveryId } = req.params;
        const { status } = req.body;

        const profile = await driverService.getProfile(userId);
        if (!profile) return res.status(404).json({ error: 'Driver profile not found' });

        const io = req.app.get('io');
        const result = await deliveryService.updateStatus(deliveryId, status, profile.id, io);
        res.json(result);

    } catch (error) {
        console.error('Error updating delivery status:', error);
        res.status(500).json({ error: 'Failed to update delivery status' });
    }
};

export const getEarnings = async (req: Request, res: Response) => {
    // Placeholder for earnings logic in Phase 5b-4
    res.json({
        balance: 0,
        currency: 'NGN',
        history: []
    });
};
