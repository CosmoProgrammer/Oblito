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
    handleVerifyPayment,
    handleCreateWholesaleRazorpayOrder,
    handleVerifyWholesalePayment
} from '../controllers/order-controller.js';

const router = Router();

router.post('/orders', protect, checkRole(['customer']), handlePostOrder);
router.post('/orders/create-razorpay-order', protect, checkRole(['customer']), handleCreateRazorpayOrder);
router.post('/orders/verify-payment', protect, checkRole(['customer']), handleVerifyPayment);

router.post('/orders/create-wholesale-razorpay-order', protect, checkRole(['retailer']), handleCreateWholesaleRazorpayOrder);
router.post('/orders/verify-wholesale-payment', protect, checkRole(['retailer']), handleVerifyWholesalePayment);


router.get('/orders', protect, checkRole(['customer']), handleGetOrders);

router.delete('/orders/:id', protect, checkRole(['customer']), handleDeleteOrder);

router.post('/wholesale-orders', protect, checkRole(['retailer', 'wholesaler']), handlePostWholesaleOrder);

router.get('/wholesale-orders', protect, checkRole(['retailer', 'wholesaler']), handleGetWholesaleOrders);

router.delete('/wholesale-orders/:id', protect, checkRole(['retailer', 'wholesaler']), handleDeleteWholesaleOrder);

export default router;