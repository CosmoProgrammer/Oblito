import { Router } from 'express';

import { protect } from "../middleware/auth-middleware.js";
import { checkRole } from '../middleware/role-middleware.js';

import { handlePostOrder, handleGetOrders, handleDeleteOrder } from '../controllers/order-controller.js';

const router = Router();

router.post('/orders', protect, checkRole(['customer']), handlePostOrder);

router.get('/orders', protect, checkRole(['customer']), handleGetOrders);

router.delete('/orders/:id', protect, checkRole(['customer']), handleDeleteOrder);

export default router;