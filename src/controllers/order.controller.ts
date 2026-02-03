import { Request, Response } from 'express';
import { z } from 'zod';
import * as OrderService from '../services/order.service';
import { OrderStatus } from '@prisma/client';
import { WebSocketServer } from '../config/socket';

// Validation schemas
const placeOrderSchema = z.object({
    restaurantId: z.string().cuid(),
    items: z.array(
        z.object({
            menuItemId: z.string().cuid(),
            quantity: z.number().int().min(1),
        })
    ).min(1),
    deliveryAddress: z.string().min(5).optional(), // Optional delivery address
    notes: z.string().optional(),
});

const updateStatusSchema = z.object({
    status: z.enum([
        'CONFIRMED',
        'PREPARING',
        'READY',
        'OUT_FOR_DELIVERY',
        'DELIVERED',
        'CANCELLED',
    ]),
});

/**
 * Place a new order (CUSTOMER role)
 */
export const placeOrder = async (req: Request, res: Response) => {
    try {
        const customerId = req.user.userId;
        const { restaurantId, items, deliveryAddress, notes } = placeOrderSchema.parse(req.body);

        // Get WebSocket server instance from app
        const io: WebSocketServer = req.app.get('io');

        const order = await OrderService.createOrder(customerId, restaurantId, items, deliveryAddress, notes, io);

        res.status(201).json({
            message: 'Order placed successfully',
            order,
        });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: error.issues });
        } else {
            res.status(400).json({ error: error.message });
        }
    }
};

/**
 * Get customer's order history
 */
export const getMyOrders = async (req: Request, res: Response) => {
    try {
        const customerId = req.user.userId;
        const orders = await OrderService.getCustomerOrders(customerId);

        res.json({
            count: orders.length,
            orders,
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Get order details by ID
 * Accessible by customer (if owns order) or restaurant owner
 */
export const getOrderDetails = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const order = await OrderService.getOrderById(id);

        // Check if user has access (either customer or restaurant owner)
        const isCustomer = order.customerId === userId;

        // Check restaurant ownership
        const { prisma } = await import('../config/prisma');
        const restaurant = await prisma.restaurant.findUnique({
            where: { id: order.restaurant.id },
            select: { userId: true },
        });

        const isRestaurantOwner = restaurant && restaurant.userId === userId;

        if (!isCustomer && !isRestaurantOwner) {
            return res.status(403).json({ error: 'Forbidden: You do not have access to this order' });
        }

        res.json(order);
    } catch (error: any) {
        if (error.message === 'Order not found') {
            res.status(404).json({ error: error.message });
        } else {
            res.status(500).json({ error: error.message });
        }
    }
};

/**
 * Get all orders for a restaurant (KITCHEN role)
 */
export const getRestaurantOrders = async (req: Request, res: Response) => {
    try {
        const { restaurantId } = req.params;
        const userId = req.user.userId;
        const status = req.query.status as OrderStatus | undefined;

        // Verify user owns the restaurant
        const restaurant = await OrderService.getOrderById(restaurantId).catch(() => null);

        // Better approach: check restaurant ownership directly
        const { prisma } = await import('../config/prisma');
        const restaurantCheck = await prisma.restaurant.findUnique({
            where: { id: restaurantId },
        });

        if (!restaurantCheck || restaurantCheck.userId !== userId) {
            return res.status(403).json({ error: 'Forbidden: You do not own this restaurant' });
        }

        const orders = await OrderService.getRestaurantOrders(restaurantId, status);

        res.json({
            count: orders.length,
            orders,
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Update order status (KITCHEN role)
 */
export const updateStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const { status } = updateStatusSchema.parse(req.body);

        // Get WebSocket server instance from app
        const io: WebSocketServer = req.app.get('io');

        const order = await OrderService.updateOrderStatus(userId, id, status as OrderStatus, io);

        res.json({
            message: 'Order status updated successfully',
            order,
        });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: error.issues });
        } else if (error.message.includes('Unauthorized')) {
            res.status(403).json({ error: error.message });
        } else if (error.message.includes('not found')) {
            res.status(404).json({ error: error.message });
        } else {
            res.status(400).json({ error: error.message });
        }
    }
};

/**
 * Cancel order
 */
export const cancelOrder = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const userRole = req.user.role;

        // Get WebSocket server instance from app
        const io: WebSocketServer = req.app.get('io');

        const order = await OrderService.cancelOrder(userId, id, userRole, io);

        res.json({
            message: 'Order cancelled successfully',
            order,
        });
    } catch (error: any) {
        if (error.message.includes('Unauthorized')) {
            res.status(403).json({ error: error.message });
        } else if (error.message.includes('not found')) {
            res.status(404).json({ error: error.message });
        } else {
            res.status(400).json({ error: error.message });
        }
    }
};
