import { prisma } from '../config/prisma';
import { DriverStatus, VehicleType } from '@prisma/client';

interface CreateDriverProfileInput {
    userId: string;
    vehicleType: VehicleType;
    vehiclePlate: string;
    licenseNumber: string;
}

interface UpdateDriverStatusInput {
    userId: string;
    isOnline: boolean;
    lat?: number;
    lng?: number;
}

export class DriverService {
    /**
     * Create a new driver profile
     */
    async createProfile(data: CreateDriverProfileInput) {
        // Check if profile already exists
        const existing = await prisma.driverProfile.findUnique({
            where: { userId: data.userId }
        });

        if (existing) {
            throw new Error('Driver profile already exists');
        }

        // Create profile
        const profile = await prisma.driverProfile.create({
            data: {
                userId: data.userId,
                vehicleType: data.vehicleType,
                vehiclePlate: data.vehiclePlate,
                licenseNumber: data.licenseNumber,
                status: 'PENDING' // Default status
            }
        });

        // Also update user role to DRIVER if not already? 
        // Note: Usually we might want to keep them as CUSTOMER until Verified?
        // But for simplicity, let's allow them to be DRIVER role but with PENDING status.
        await prisma.user.update({
            where: { id: data.userId },
            data: { role: 'DRIVER' }
        });

        return profile;
    }

    /**
     * Get driver profile by User ID
     */
    async getProfile(userId: string) {
        return prisma.driverProfile.findUnique({
            where: { userId },
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
            }
        });
    }

    /**
     * Toggle Online/Offline status
     */
    async updateStatus(input: UpdateDriverStatusInput) {
        const { userId, isOnline, lat, lng } = input;

        return prisma.driverProfile.update({
            where: { userId },
            data: {
                isOnline,
                // Only update location if provided
                ...(lat !== undefined && lng !== undefined ? {
                    currentLat: lat,
                    currentLng: lng,
                    lastLocationUpdate: new Date()
                } : {})
            }
        });
    }

    /**
     * Update Location (periodically called)
     */
    async updateLocation(userId: string, lat: number, lng: number) {
        return prisma.driverProfile.update({
            where: { userId },
            data: {
                currentLat: lat,
                currentLng: lng,
                lastLocationUpdate: new Date()
            }
        });
    }

    /**
     * Admin: Verify or Reject Driver
     */
    async verifyDriver(adminId: string, driverId: string, status: 'VERIFIED' | 'REJECTED' | 'SUSPENDED') {
        // Here we could log which admin performed the action
        return prisma.driverProfile.update({
            where: { id: driverId },
            data: { status }
        });
    }

    /**
     * Find nearby available drivers (Internal use for order assignment logic)
     */
    async findNearbyDrivers(lat: number, lng: number, radiusKm: number = 5) {
        // Basic approximation using bounding box/filtering?
        // Prisma doesn't support PostGIS out of the box easily without raw queries.
        // For Phase 5b, we'll fetch online drivers and filter in memory (assuming small fleet).
        // For production, use PostGIS + raw queries.

        const drivers = await prisma.driverProfile.findMany({
            where: {
                status: 'VERIFIED',
                isOnline: true,
                currentLat: { not: null },
                currentLng: { not: null }
            },
            include: {
                user: {
                    select: { name: true, phone: true }
                }
            }
        });

        // Filter by distance
        return drivers.filter(driver => {
            if (!driver.currentLat || !driver.currentLng) return false;
            const distance = this.calculateDistance(lat, lng, driver.currentLat, driver.currentLng);
            return distance <= radiusKm;
        });
    }

    /**
     * Haversine formula for distance in km
     */
    private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371; // Radius of the earth in km
        const dLat = this.deg2rad(lat2 - lat1);
        const dLon = this.deg2rad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c; // Distance in km
        return d;
    }

    private deg2rad(deg: number): number {
        return deg * (Math.PI / 180);
    }
}

export const driverService = new DriverService();
