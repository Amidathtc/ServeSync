import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import { verifyToken } from '../utils/jwt';
import { SOCKET_EVENTS, SocketUserData, getRoomName } from './events';

/**
 * Initialize Socket.io server with authentication and event handlers
 * @param httpServer - HTTP server instance from Express
 * @returns Configured Socket.io server instance
 */
export function initializeWebSocket(httpServer: HttpServer): SocketServer {
    const io = new SocketServer(httpServer, {
        cors: {
            origin: process.env.CLIENT_URL || '*',
            credentials: true,
            methods: ['GET', 'POST']
        },
        pingTimeout: 60000,
        pingInterval: 25000
    });

    // Authentication middleware
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;

            if (!token) {
                return next(new Error('Authentication required: No token provided'));
            }

            const payload = verifyToken(token);

            if (!payload || !payload.userId || !payload.role) {
                return next(new Error('Invalid token payload'));
            }

            // Attach user data to socket
            socket.data.user = {
                userId: payload.userId,
                role: payload.role
            } as SocketUserData;

            next();
        } catch (error) {
            next(new Error('Authentication failed: Invalid or expired token'));
        }
    });

    // Connection event handler
    io.on(SOCKET_EVENTS.CONNECTION, (socket: Socket) => {
        const user = socket.data.user as SocketUserData;
        console.log(`✅ WebSocket connected: User ${user.userId} (${user.role})`);

        // Handle joining restaurant room (for kitchen staff)
        socket.on(SOCKET_EVENTS.JOIN_RESTAURANT, async (restaurantId: string) => {
            try {
                // Only KITCHEN and ADMIN roles can join restaurant rooms
                if (user.role !== 'KITCHEN' && user.role !== 'ADMIN') {
                    socket.emit(SOCKET_EVENTS.ERROR, {
                        message: 'Forbidden: Only kitchen staff can join restaurant rooms'
                    });
                    return;
                }

                // TODO: Verify user owns this restaurant (add validation from service)
                const roomName = getRoomName.restaurant(restaurantId);
                await socket.join(roomName);

                console.log(`🍽️  Kitchen user ${user.userId} joined restaurant ${restaurantId}`);
                socket.emit('joined:restaurant', { restaurantId, room: roomName });
            } catch (error) {
                console.error('Error joining restaurant room:', error);
                socket.emit(SOCKET_EVENTS.ERROR, {
                    message: 'Failed to join restaurant room'
                });
            }
        });

        // Handle leaving restaurant room
        socket.on(SOCKET_EVENTS.LEAVE_RESTAURANT, (restaurantId: string) => {
            const roomName = getRoomName.restaurant(restaurantId);
            socket.leave(roomName);
            console.log(`Kitchen user ${user.userId} left restaurant ${restaurantId}`);
        });

        // Handle joining customer orders room
        socket.on(SOCKET_EVENTS.JOIN_CUSTOMER_ORDERS, () => {
            const roomName = getRoomName.customer(user.userId);
            socket.join(roomName);
            console.log(`👤 Customer ${user.userId} joined their orders room`);
            socket.emit('joined:customer', { userId: user.userId, room: roomName });
        });

        // Handle leaving customer orders room
        socket.on(SOCKET_EVENTS.LEAVE_CUSTOMER_ORDERS, () => {
            const roomName = getRoomName.customer(user.userId);
            socket.leave(roomName);
            console.log(`Customer ${user.userId} left their orders room`);
        });

        // ==========================================
        // DRIVER HANDLERS
        // ==========================================

        socket.on(SOCKET_EVENTS.JOIN_DRIVER, () => {
            if (user.role !== 'DRIVER') return;
            const roomName = getRoomName.driver(user.userId);
            socket.join(roomName);
            console.log(`🛵 Driver ${user.userId} joined personal room`);
            socket.emit('joined:driver', { room: roomName });
        });

        // Tracking: Driver sends location -> Server relays to Order room
        socket.on(SOCKET_EVENTS.DRIVER_LOCATION_UPDATE, (data: { lat: number, lng: number, activeOrderId?: string }) => {
            if (user.role !== 'DRIVER') return;

            // 1. Update DB (Throttled in real app, simplified here)
            // In a real app we'd use Redis or a separate service to avoid high DB write load
            // For this portfolio, we will just relay it for visualization

            // 2. If Driver has an active order, emit to that order's room
            if (data.activeOrderId) {
                const orderRoom = getRoomName.order(data.activeOrderId);
                socket.to(orderRoom).emit(SOCKET_EVENTS.ORDER_TRACKING_UPDATE, {
                    orderId: data.activeOrderId,
                    driverId: user.userId,
                    lat: data.lat,
                    lng: data.lng,
                    timestamp: new Date()
                });
            }
        });

        // General: Join specific order (for Tracking UI)
        socket.on(SOCKET_EVENTS.JOIN_ORDER, (orderId: string) => {
            // Allow Customers, Drivers, Admin, Kitchen to join tracking
            // In real app: Add logic to verify they are part of this order
            const roomName = getRoomName.order(orderId);
            socket.join(roomName);
            console.log(`User ${user.userId} joined tracking for order ${orderId}`);
        });

        // Handle disconnection
        socket.on(SOCKET_EVENTS.DISCONNECT, (reason) => {
            console.log(`❌ WebSocket disconnected: User ${user.userId} - Reason: ${reason}`);
        });

        // Handle errors
        socket.on(SOCKET_EVENTS.ERROR, (error) => {
            console.error(`WebSocket error for user ${user.userId}:`, error);
        });
    });

    console.log('🌐 WebSocket server initialized with authentication');
    return io;
}

/**
 * Type-safe Socket.io server instance
 * Export for use in services and controllers
 */
export type WebSocketServer = SocketServer;
