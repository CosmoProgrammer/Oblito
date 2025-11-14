import { Router } from 'express';

import { protect } from "../middleware/auth-middleware.js";
import { checkRole } from '../middleware/role-middleware.js';

import { handleGetCart, handlePostCart, handlePutCart, handleDeleteCartItem } from '../controllers/cart-controller.js';

const router = Router();

router.get('/cart', protect, checkRole(['customer']),  handleGetCart);

router.post('/cart', protect, checkRole(['customer']), handlePostCart);

router.put('/cart/items/:id', protect, checkRole(['customer']), handlePutCart);

router.delete('/cart/items/:id', protect, checkRole(['customer']), handleDeleteCartItem);

export default router;