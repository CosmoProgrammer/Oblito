import { Router } from 'express';

import { protect } from "../middleware/auth-middleware.js";
import { checkRole } from '../middleware/role-middleware.js';

import { handlePostOrder, handleGetOrders } from '../controllers/order-controller.js';

const router = Router();

router.post('/orders', protect, checkRole(['customer']), handlePostOrder);

router.get('/orders', protect, checkRole(['customer']), handleGetOrders);

export default router;