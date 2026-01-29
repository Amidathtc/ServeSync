import { prisma } from '../config/prisma';
import { OrderStatus } from '@prisma/client';

/**
 * Create a new order
 * - Validates all items exist and are available
 * - Calculates total from database prices (security)
 * - Creates order and order items in a transaction
 */
export const createOrder = async (
    customerId: string,
    restaurantId: string,
    items: { menuItemId: string; quantity: number }[],
    notes?: string
) => {
    // Validate restaurant exists
    const restaurant = await prisma.restaurant.findUnique({
        where: { id: restaurantId },
    });

    if (!restaurant) {
        throw new Error('Restaurant not found');
    }

    // Fetch all menu items to validate and calculate total
    const menuItemIds = items.map(item => item.menuItemId);
    const menuItems = await prisma.menuItem.findMany({
        where: {
            id: { in: menuItemIds },
            restaurantId, // Ensure items belong to this restaurant
        },
    });

    // Validate all items exist
    if (menuItems.length !== menuItemIds.length) {
        throw new Error('One or more menu items not found or do not belong to this restaurant');
    }

    // Check all items are available
    const unavailableItems = menuItems.filter(item => !item.available);
    if (unavailableItems.length > 0) {
        throw new Error(`Items not available: ${unavailableItems.map(i => i.name).join(', ')}`);
    }

    // Calculate total from database prices (never trust client)
    let total = 0;
    const orderItemsData = items.map(item => {
        const menuItem = menuItems.find(mi => mi.id === item.menuItemId)!;
        const itemTotal = menuItem.price * item.quantity;
        total += itemTotal;

        return {
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            price: menuItem.price, // Store price at time of order
        };
    });

    // Create order and order items in transaction
    const order = await prisma.order.create({
        data: {
            customerId,
            restaurantId,
            total,
            notes,
            status: OrderStatus.PENDING,
            items: {
                create: orderItemsData,
            },
        },
        include: {
            items: {
                include: {
                    menuItem: true,
                },
            },
            restaurant: {
                select: {
                    id: true,
                    name: true,
                    address: true,
                    phone: true,
                },
            },
        },
    });

    return order;
};

/**
 * Get order by ID with full details
 */
export const getOrderById = async (orderId: string) => {
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
            items: {
                include: {
                    menuItem: true,
                },
            },
            customer: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
            restaurant: {
                select: {
                    id: true,
                    name: true,
                    address: true,
                    phone: true,
                },
            },
        },
    });

    if (!order) {
        throw new Error('Order not found');
    }

    return order;
};

/**
 * Get all orders for a customer
 */
export const getCustomerOrders = async (customerId: string) => {
    return await prisma.order.findMany({
        where: { customerId },
        include: {
            restaurant: {
                select: {
                    id: true,
                    name: true,
                },
            },
            items: {
                include: {
                    menuItem: {
                        select: {
                            name: true,
                        },
                    },
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    });
};

/**
 * Get all orders for a restaurant
 */
export const getRestaurantOrders = async (restaurantId: string, status?: OrderStatus) => {
    return await prisma.order.findMany({
        where: {
            restaurantId,
            ...(status && { status }),
        },
        include: {
            customer: {
                select: {
                    id: true,
                    name: true,
                    phone: true,
                },
            },
            items: {
                include: {
                    menuItem: true,
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    });
};

/**
 * Valid status transitions
 */
const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
    [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
    [OrderStatus.CONFIRMED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
    [OrderStatus.PREPARING]: [OrderStatus.READY, OrderStatus.CANCELLED],
    [OrderStatus.READY]: [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.CANCELLED],
    [OrderStatus.OUT_FOR_DELIVERY]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
    [OrderStatus.DELIVERED]: [],
    [OrderStatus.CANCELLED]: [],
};

/**
 * Update order status
 * Only kitchen staff (restaurant owner) can update
 */
export const updateOrderStatus = async (
    userId: string,
    orderId: string,
    newStatus: OrderStatus
) => {
    // Get order with restaurant
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
            restaurant: true,
        },
    });

    if (!order) {
        throw new Error('Order not found');
    }

    // Verify user owns the restaurant
    if (order.restaurant.userId !== userId) {
        throw new Error('Unauthorized: You do not own this restaurant');
    }

    // Validate status transition
    const validTransitions = VALID_TRANSITIONS[order.status];
    if (!validTransitions.includes(newStatus)) {
        throw new Error(
            `Invalid status transition: ${order.status} -> ${newStatus}. Valid transitions: ${validTransitions.join(', ')}`
        );
    }

    // Update status
    return await prisma.order.update({
        where: { id: orderId },
        data: { status: newStatus },
        include: {
            items: {
                include: {
                    menuItem: true,
                },
            },
        },
    });
};

/**
 * Cancel order
 * - Customers can cancel PENDING or CONFIRMED orders
 * - Kitchen staff can cancel anytime
 */
export const cancelOrder = async (userId: string, orderId: string, userRole: string) => {
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
            restaurant: true,
        },
    });

    if (!order) {
        throw new Error('Order not found');
    }

    // Check permissions
    const isCustomer = order.customerId === userId;
    const isRestaurantOwner = order.restaurant.userId === userId;

    if (!isCustomer && !isRestaurantOwner) {
        throw new Error('Unauthorized: You cannot cancel this order');
    }

    // Customer restrictions
    if (isCustomer && userRole === 'CUSTOMER') {
        if (order.status !== OrderStatus.PENDING && order.status !== OrderStatus.CONFIRMED) {
            throw new Error('Customers can only cancel orders that are PENDING or CONFIRMED');
        }
    }

    // Already cancelled or delivered
    if (order.status === OrderStatus.CANCELLED || order.status === OrderStatus.DELIVERED) {
        throw new Error(`Order is already ${order.status}`);
    }

    // Cancel the order
    return await prisma.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.CANCELLED },
    });
};
