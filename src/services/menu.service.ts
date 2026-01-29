import { prisma } from '../config/prisma';
import { MenuItem } from '@prisma/client';

export const addMenuItem = async (userId: string, restaurantId: string, data: { name: string; description?: string; price: number; category: string; image?: string }) => {
    // Verify restaurant exists and user owns it
    const restaurant = await prisma.restaurant.findUnique({
        where: { id: restaurantId },
    });

    if (!restaurant) {
        throw new Error('Restaurant not found');
    }

    if (restaurant.userId !== userId) {
        throw new Error('Unauthorized: You do not own this restaurant');
    }

    return await prisma.menuItem.create({
        data: {
            ...data,
            restaurantId,
        },
    });
};

export const updateMenuItem = async (userId: string, itemId: string, data: Partial<MenuItem>) => {
    // Find item and include restaurant to check ownership
    const item = await prisma.menuItem.findUnique({
        where: { id: itemId },
        include: { restaurant: true },
    });

    if (!item) {
        throw new Error('Menu item not found');
    }

    if (item.restaurant.userId !== userId) {
        throw new Error('Unauthorized: You do not own this restaurant');
    }

    return await prisma.menuItem.update({
        where: { id: itemId },
        data,
    });
};

export const deleteMenuItem = async (userId: string, itemId: string) => {
    const item = await prisma.menuItem.findUnique({
        where: { id: itemId },
        include: { restaurant: true },
    });

    if (!item) {
        throw new Error('Menu item not found');
    }

    if (item.restaurant.userId !== userId) {
        throw new Error('Unauthorized: You do not own this restaurant');
    }

    return await prisma.menuItem.delete({
        where: { id: itemId },
    });
};

export const getMenuItems = async (restaurantId: string) => {
    return await prisma.menuItem.findMany({
        where: { restaurantId },
        orderBy: { category: 'asc' }, // Organize by category
    });
};
