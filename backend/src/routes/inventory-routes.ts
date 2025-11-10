import { Router } from 'express';

import { protect } from "../middleware/auth-middleware.js";
import { checkRole } from '../middleware/role-middleware.js';

import { handleGetInventory } from '../controllers/inventory-controller.js';

const router = Router();

router.get('/inventory', protect, checkRole(['retailer', 'wholesaler']), handleGetInventory);

export default router;