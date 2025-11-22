import { Router } from 'express';

import { protect } from "../middleware/auth-middleware.js";
import { checkRole } from '../middleware/role-middleware.js';

import { 
    handlePostOrder, 
    handleGetOrders, 
    handleDeleteOrder, 
    handlePostWholesaleOrder, 
    handleGetWholesaleOrders, 
    handleDeleteWholesaleOrder,
    handleCreateRazorpayOrder,
    handleVerifyPayment
} from '../controllers/order-controller.js';

const router = Router();

router.post('/orders', protect, checkRole(['customer']), handlePostOrder);
router.post('/orders/create-razorpay-order', protect, checkRole(['customer']), handleCreateRazorpayOrder);
router.post('/orders/verify-payment', protect, checkRole(['customer']), handleVerifyPayment);

router.get('/orders', protect, checkRole(['customer']), handleGetOrders);

router.delete('/orders/:id', protect, checkRole(['customer']), handleDeleteOrder);

router.post('/wholesale-orders', protect, checkRole(['retailer', 'wholesaler']), handlePostWholesaleOrder);

router.get('/wholesale-orders', protect, checkRole(['retailer', 'wholesaler']), handleGetWholesaleOrders);

router.delete('/wholesale-orders/:id', protect, checkRole(['retailer', 'wholesaler']), handleDeleteWholesaleOrder);

export default router;