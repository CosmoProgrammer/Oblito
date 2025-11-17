import { Router } from 'express';

import { protect } from "../middleware/auth-middleware.js";
import { checkRole } from '../middleware/role-middleware.js';

import { handleGetInventory, handleCreateRetailListing } from '../controllers/inventory-controller.js';

const router = Router();

router.get('/inventory', protect, checkRole(['retailer', 'wholesaler']), handleGetInventory);

//router.post('/inventory/listings', protect, checkRole(['retailer']), handleCreateRetailListing);

export default router;