import { Router } from 'express';

import { protect } from "../middleware/auth-middleware.js";
import { checkRole } from '../middleware/role-middleware.js';

import { handleGetAddresses, handlePostAddress, handleDeleteAddress, handlePatchAddress } from '../controllers/address-controller.js';

const router = Router();

router.get('/addresses', protect, checkRole(['customer', 'retailer', 'wholesaler']), handleGetAddresses);

router.post('/addresses', protect, checkRole(['customer', 'retailer', 'wholesaler']), handlePostAddress);

router.patch('/addresses/:id', protect, checkRole(['customer', 'retailer', 'wholesaler']), handlePatchAddress);

router.delete('/addresses/:id', protect, checkRole(['customer', 'retailer', 'wholesaler']), handleDeleteAddress);

export default router;