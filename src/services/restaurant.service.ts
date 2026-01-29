import { prisma } from '../config/prisma';
import { Restaurant } from '@prisma/client';

export const createRestaurant = async (userId: string, data: { name: string; address: string; phone?: string; email?: string; image?: string }) => {
    // Check if user already has a restaurant (Since userId is unique in Restaurant model)
    const existing = await prisma.restaurant.findUnique({
        where: { userId },
    });

    if (existing) {
        throw new Error('User already owns a restaurant');
    }

    return await prisma.restaurant.create({
        data: {
            ...data,
            userId,
        },
    });
};

export const getRestaurantById = async (id: string) => {
    return await prisma.restaurant.findUnique({
        where: { id },
        include: {
            menuItems: true, // Include menu items often relevant
        },
    });
};

export const getAllRestaurants = async () => {
    return await prisma.restaurant.findMany({
        include: {
            _count: {
                select: { menuItems: true } // Good for list views
            }
        }
    });
};

export const updateRestaurant = async (userId: string, restaurantId: string, data: Partial<Restaurant>) => {
    // 1. Check existence
    const restaurant = await prisma.restaurant.findUnique({
        where: { id: restaurantId },
    });

    if (!restaurant) {
        throw new Error('Restaurant not found');
    }

    // 2. Check ownership
    if (restaurant.userId !== userId) {
        throw new Error('Unauthorized: You do not own this restaurant');
    }

    // 3. Update
    return await prisma.restaurant.update({
        where: { id: restaurantId },
        data,
    });
};

export const deleteRestaurant = async (userId: string, restaurantId: string) => {
    const restaurant = await prisma.restaurant.findUnique({
        where: { id: restaurantId },
    });

    if (!restaurant) {
        throw new Error('Restaurant not found');
    }

    if (restaurant.userId !== userId) {
        throw new Error('Unauthorized: You do not own this restaurant');
    }

    return await prisma.restaurant.delete({
        where: { id: restaurantId },
    });
};
