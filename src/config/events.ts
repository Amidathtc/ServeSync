import { OrderStatus } from '@prisma/client';

/**
 * WebSocket Event Types
 * Centralized event names for Socket.io communication
 */
export const SOCKET_EVENTS = {
    // Server → Client Events
    ORDER_CREATED: 'order:created',
    ORDER_UPDATED: 'order:updated',
    ORDER_CANCELLED: 'order:cancelled',
    NEW_ORDER_AVAILABLE: 'driver:new_order',      // Alert for drivers
    ORDER_TRACKING_UPDATE: 'order:tracking_update', // Relayed to customer
    DRIVER_ASSIGNED: 'order:driver_assigned',
    DELIVERY_STATUS_UPDATE: 'delivery:status_update',

    // Client → Server Events
    JOIN_RESTAURANT: 'join:restaurant',
    LEAVE_RESTAURANT: 'leave:restaurant',
    JOIN_CUSTOMER_ORDERS: 'join:customer',
    LEAVE_CUSTOMER_ORDERS: 'leave:customer',
    JOIN_DRIVER: 'join:driver',        // Driver joins their personal room
    LEAVE_DRIVER: 'leave:driver',
    JOIN_ORDER: 'join:order',          // Track specific order
    DRIVER_LOCATION_UPDATE: 'driver:location_update',

    // Connection Events
    CONNECTION: 'connection',
    DISCONNECT: 'disconnect',
    ERROR: 'error'
} as const;

/**
 * Order Event Payload
 * Data structure sent to clients on order events
 */
export interface OrderEventPayload {
    orderId: string;
    restaurantId: string;
    customerId: string;
    status: OrderStatus;
    totalAmount: number;
    items: Array<{
        name: string;
        quantity: number;
        price: number;
    }>;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Socket Authentication Data
 * User data attached to socket instance after authentication
 */
export interface SocketUserData {
    userId: string;
    role: 'CUSTOMER' | 'KITCHEN' | 'ADMIN' | 'DRIVER';
}

/**
 * Room Naming Conventions
 * Helper functions to generate consistent room names
 */
export const getRoomName = {
    restaurant: (restaurantId: string) => `restaurant:${restaurantId}`,
    customer: (customerId: string) => `customer:${customerId}`,
    driver: (driverId: string) => `driver:${driverId}`,
    order: (orderId: string) => `order:${orderId}`
};
