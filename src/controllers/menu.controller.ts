import { Request, Response } from 'express';
import { z } from 'zod';
import * as MenuService from '../services/menu.service';
import { formatPriceInt, formatPrice } from '../utils/formatters';

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

        const item: any = await MenuService.addMenuItem(userId, restaurantId, data);

        // Format response with restaurant's currency
        const formattedItem = {
            ...item,
            price: formatPriceInt(item.price),
            formattedPrice: formatPrice(item.price, item.restaurantCurrency || 'NGN'),
            currency: item.restaurantCurrency || 'NGN'
        };

        delete formattedItem.restaurantCurrency; // Remove internal field
        res.status(201).json(formattedItem);
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

        const item: any = await MenuService.updateMenuItem(userId, itemId, data);

        // Format response with restaurant's currency
        const formattedItem = {
            ...item,
            price: formatPriceInt(item.price),
            formattedPrice: formatPrice(item.price, item.restaurantCurrency || 'NGN'),
            currency: item.restaurantCurrency || 'NGN'
        };

        delete formattedItem.restaurantCurrency; // Remove internal field
        res.json(formattedItem);
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
        const items: any[] = await MenuService.getMenuItems(restaurantId);

        // Format all prices with restaurant's currency
        const formattedItems = items.map(item => {
            const formatted = {
                ...item,
                price: formatPriceInt(item.price),
                formattedPrice: formatPrice(item.price, item.restaurantCurrency || 'NGN'),
                currency: item.restaurantCurrency || 'NGN'
            };
            delete formatted.restaurantCurrency; // Remove internal field
            return formatted;
        });

        res.json(formattedItems);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}
