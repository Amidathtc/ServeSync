import { Request, Response } from 'express';
import { z } from 'zod';
import * as RestaurantService from '../services/restaurant.service';

const phoneRegex = /^\+[1-9]\d{6,14}$/;

const createRestaurantSchema = z.object({
    name: z.string().min(2),
    address: z.string().min(5),
    phone: z.string().regex(phoneRegex, 'Phone must be in E.164 format e.g. +2348012345678').optional(),
    email: z.string().email().optional(),
    currency: z.string().length(3, 'Currency must be a 3-letter ISO code e.g. NGN, USD').optional(),
    image: z.string().url().optional(),
});

const updateRestaurantSchema = createRestaurantSchema.partial();

export const create = async (req: Request, res: Response) => {
    try {
        const userId = req.user.userId; // From auth middleware
        const data = createRestaurantSchema.parse(req.body);
        const restaurant = await RestaurantService.createRestaurant(userId, data);
        res.status(201).json(restaurant);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: error.issues });
        } else {
            res.status(400).json({ error: error.message });
        }
    }
};

export const get = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const restaurant = await RestaurantService.getRestaurantById(id);
        if (!restaurant) {
            return res.status(404).json({ error: 'Restaurant not found' });
        }
        res.json(restaurant);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const list = async (req: Request, res: Response) => {
    try {
        const restaurants = await RestaurantService.getAllRestaurants();
        res.json(restaurants);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const update = async (req: Request, res: Response) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        const data = updateRestaurantSchema.parse(req.body);
        const restaurant = await RestaurantService.updateRestaurant(userId, id, data);
        res.json(restaurant);
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

export const remove = async (req: Request, res: Response) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        await RestaurantService.deleteRestaurant(userId, id);
        res.status(200).json({ message: 'Restaurant deleted successfully' });
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
