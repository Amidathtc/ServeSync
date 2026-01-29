import { Router } from 'express';
import * as RestaurantController from '../controllers/restaurant.controller';
import * as MenuController from '../controllers/menu.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

// Restaurant Routes
// Create: Only KITCHEN or ADMIN
router.post('/', authenticate, authorize(['KITCHEN', 'ADMIN']), RestaurantController.create);
// Read: Public
router.get('/', RestaurantController.list);
router.get('/:id', RestaurantController.get);
// Update/Delete: Only KITCHEN or ADMIN (Service also checks ownership)
router.put('/:id', authenticate, authorize(['KITCHEN', 'ADMIN']), RestaurantController.update);
router.delete('/:id', authenticate, authorize(['KITCHEN', 'ADMIN']), RestaurantController.remove);

// Menu Routes (Nested)
// GET /restaurants/:restaurantId/menu: Public
router.get('/:restaurantId/menu', MenuController.getItems);
// POST /restaurants/:restaurantId/menu: Only KITCHEN or ADMIN
router.post('/:restaurantId/menu', authenticate, authorize(['KITCHEN', 'ADMIN']), MenuController.addItem);

// Menu Item Routes (Direct ID)
// Update/Delete: Only KITCHEN or ADMIN
router.put('/menu/:itemId', authenticate, authorize(['KITCHEN', 'ADMIN']), MenuController.updateItem);
router.delete('/menu/:itemId', authenticate, authorize(['KITCHEN', 'ADMIN']), MenuController.deleteItem);

export default router;
