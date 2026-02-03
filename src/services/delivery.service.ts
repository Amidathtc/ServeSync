import { prisma } from '../config/prisma';
import { DeliveryStatus } from '@prisma/client';

const USE_MOCK = process.env.USE_REAL_APIS !== 'true';

interface GeocodeResult {
    address: string;
    lat: number;
    lng: number;
}

export class DeliveryService {
    // ==========================================
    // Core Logistics (DB Operations)
    // ==========================================

    /**
     * Create initial delivery record
     */
    async createDelivery(orderId: string, address: string, lat?: number, lng?: number) {
        return prisma.delivery.create({
            data: {
                orderId,
                address,
                latitude: lat,
                longitude: lng,
                status: 'PENDING'
            }
        });
    }

    /**
     * Find available orders nearby for a driver
     */
    async getAvailableOrdersForDriver(driverLat: number, driverLng: number, radiusKm: number = 5) {
        const deliveries = await prisma.delivery.findMany({
            where: {
                status: 'PENDING',
                driverId: null
            },
            include: {
                order: {
                    include: {
                        restaurant: {
                            select: { name: true, address: true }
                        }
                    }
                }
            }
        });

        return deliveries.filter(d => {
            if (!d.latitude || !d.longitude) return false;
            const dist = this.calculateDistance(driverLat, driverLng, d.latitude, d.longitude);
            return dist <= radiusKm;
        });
    }

    /**
     * Assign a driver to a delivery
     */
    async assignDriver(deliveryId: string, driverId: string, io?: any) {
        // Atomic update to ensure no double booking
        const updated = await prisma.delivery.updateMany({
            where: {
                id: deliveryId,
                status: 'PENDING',
                driverId: null
            },
            data: {
                driverId,
                status: 'ASSIGNED'
            }
        });

        if (updated.count === 0) {
            throw new Error('Delivery not available or already assigned');
        }

        const delivery = await prisma.delivery.findUnique({
            where: { id: deliveryId },
            include: { order: true }
        });

        if (io && delivery) {
            import('../config/events').then(({ SOCKET_EVENTS, getRoomName }) => {
                const orderRoom = getRoomName.order(delivery.orderId);
                const customerRoom = getRoomName.customer(delivery.order.customerId);

                const payload = {
                    orderId: delivery.orderId,
                    driverId,
                    status: 'ASSIGNED',
                    eta: '15 mins' // Mock ETA
                };

                io.to(orderRoom).emit(SOCKET_EVENTS.DRIVER_ASSIGNED, payload);
                io.to(customerRoom).emit(SOCKET_EVENTS.DRIVER_ASSIGNED, payload);
            });
        }

        return delivery;
    }

    /**
     * Update delivery status
     */
    async updateStatus(deliveryId: string, status: DeliveryStatus, driverId: string, io?: any) {
        const delivery = await prisma.delivery.findFirst({
            where: { id: deliveryId, driverId }
        });

        if (!delivery) {
            throw new Error('Delivery not found or not assigned to you');
        }

        const updates: any = { status };

        if (status === 'DELIVERED') {
            updates.actualTime = new Date();
        }

        const result = await prisma.delivery.update({
            where: { id: deliveryId },
            data: updates
        });

        // Sync with Order status
        let orderStatus: any = null;
        if (status === 'IN_TRANSIT') orderStatus = 'OUT_FOR_DELIVERY';
        if (status === 'DELIVERED') orderStatus = 'DELIVERED';

        if (orderStatus) {
            await prisma.order.update({
                where: { id: result.orderId },
                data: { status: orderStatus }
            });
        }

        if (io) {
            import('../config/events').then(({ SOCKET_EVENTS, getRoomName }) => {
                const orderRoom = getRoomName.order(result.orderId);
                io.to(orderRoom).emit(SOCKET_EVENTS.DELIVERY_STATUS_UPDATE || 'order:delivery_status', {
                    orderId: result.orderId,
                    status,
                    timestamp: new Date()
                });
            });
        }

        return result;
    }

    // ==========================================
    // Geocoding & Pricing (Utils)
    // ==========================================

    /**
     * Validate and geocode an address
     */
    async validateAddress(address: string): Promise<GeocodeResult> {
        if (USE_MOCK) {
            return this.mockGeocode(address);
        } else {
            // Placeholder for real Google Maps implementation
            return this.mockGeocode(address);
        }
    }

    private mockGeocode(address: string): GeocodeResult {
        // Basic validation
        if (!address || address.trim().length < 5) {
            throw new Error('Invalid address: Address too short');
        }

        // Generate mock coordinates based on hash of address
        const hash = this.hashString(address);
        const lat = 6.5244 + (hash % 1000) / 10000; // Around Lagos, Nigeria
        const lng = 3.3792 + (hash % 1000) / 10000;

        return {
            address: address.trim(), // Return formatted address
            lat,
            lng
        };
    }

    /**
     * Calculate delivery fee based on distance
     * Pricing: ₦500 base + ₦100/km, max ₦2000
     */
    calculateDeliveryFee(distanceKm: number): number {
        const BASE_FEE = 500;
        const PER_KM_RATE = 100;
        const MAX_FEE = 2000;

        const fee = Math.min(BASE_FEE + (distanceKm * PER_KM_RATE), MAX_FEE);
        return Math.round(fee * 100) / 100;
    }

    /**
     * Calculate distance between two points using Haversine formula
     */
    calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
        const R = 6371; // Earth's radius in km
        const dLat = this.toRad(lat2 - lat1);
        const dLng = this.toRad(lng2 - lng1);

        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRad(lat1)) *
            Math.cos(this.toRad(lat2)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return Math.round(R * c * 100) / 100;
    }

    /**
     * Check if address is within delivery range
     * Max range: 15km
     */
    isWithinDeliveryRange(
        restaurantLat: number,
        restaurantLng: number,
        deliveryLat: number,
        deliveryLng: number
    ): { withinRange: boolean; distance: number } {
        const MAX_DELIVERY_DISTANCE = 15; // km
        const distance = this.calculateDistance(
            restaurantLat,
            restaurantLng,
            deliveryLat,
            deliveryLng
        );

        return {
            withinRange: distance <= MAX_DELIVERY_DISTANCE,
            distance,
        };
    }

    private toRad(value: number): number {
        return (value * Math.PI) / 180;
    }

    private hashString(str: string): number {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash;
        }
        return Math.abs(hash);
    }
}

export const deliveryService = new DeliveryService();
