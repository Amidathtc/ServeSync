import { Request, Response } from 'express';
import { z } from 'zod';
import * as MenuService from '../services/menu.service';

const createMenuItemSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    price: z.number().positive(),
    category: z.string().min(1),
    image: z.string().url().optional(),
});

const updateMenuItemSchema = createMenuItemSchema.partial();

// POST /restaurants/:restaurantId/menu
export const addItem = async (req: Request, res: Response) => {
    try {
        const userId = req.user.userId;
        const { restaurantId } = req.params;
        const data = createMenuItemSchema.parse(req.body);

        const item = await MenuService.addMenuItem(userId, restaurantId, data);
        res.status(201).json(item);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: error.issues });
        } else if (error.message.includes('Unauthorized')) {
            res.status(403).json({ error: error.message });
        } else {
            res.status(400).json({ error: error.message });
        }
    }
};

// PUT /restaurants/:restaurantId/menu/:itemId 
// Or simply /menu/:itemId ? Standard REST often uses nested or flat. 
// Our route structure in plan suggests nesting? 
// Let's assume flat ID access for update/delete as they are global IDs (CUID).
export const updateItem = async (req: Request, res: Response) => {
    try {
        const userId = req.user.userId;
        const { itemId } = req.params;
        const data = updateMenuItemSchema.parse(req.body);

        const item = await MenuService.updateMenuItem(userId, itemId, data);
        res.json(item);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: error.issues });
        } else if (error.message.includes('Unauthorized')) {
            res.status(403).json({ error: error.message });
        } else {
            res.status(400).json({ error: error.message });
        }
    }
};

export const deleteItem = async (req: Request, res: Response) => {
    try {
        const userId = req.user.userId;
        const { itemId } = req.params;

        await MenuService.deleteMenuItem(userId, itemId);
        res.status(200).json({ message: 'Menu item deleted successfully' });
    } catch (error: any) {
        if (error.message.includes('Unauthorized')) {
            res.status(403).json({ error: error.message });
        } else {
            res.status(400).json({ error: error.message });
        }
    }
};

export const getItems = async (req: Request, res: Response) => {
    try {
        const { restaurantId } = req.params;
        const items = await MenuService.getMenuItems(restaurantId);
        res.json(items);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}
