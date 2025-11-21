import { Router } from 'express';

import { protect } from "../middleware/auth-middleware.js";
import { checkRole } from '../middleware/role-middleware.js';

import { handleGetInventory, handleCreateRetailListing, handleManualStockUpdate } from '../controllers/inventory-controller.js';

const router = Router();

router.get('/inventory', protect, checkRole(['retailer', 'wholesaler']), handleGetInventory);

router.patch('/inventory/:shopInventoryId', protect, checkRole(['retailer']), handleManualStockUpdate);

////router.post('/inventory/listings', protect, checkRole(['retailer']), handleCreateRetailListing);

export default router;