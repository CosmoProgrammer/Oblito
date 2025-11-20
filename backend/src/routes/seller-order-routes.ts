import { Router } from 'express';

import { protect } from "../middleware/auth-middleware.js";
import { checkRole } from '../middleware/role-middleware.js';
import { handleGetSellerOrders, handleUpdateOrderItemStatus, handleUpdatePaymentStatus } from '../controllers/seller-order-controller.js';

const router = Router();

router.get('/seller-orders', protect, checkRole(['retailer', 'wholesaler']), handleGetSellerOrders);

router.patch('/seller-orders/items/:orderItemId', protect, checkRole(['retailer', 'wholesaler']), handleUpdateOrderItemStatus);

router.patch('/seller-orders/:orderId/payment', protect, checkRole(['retailer', 'wholesaler']), handleUpdatePaymentStatus);

export default router;
