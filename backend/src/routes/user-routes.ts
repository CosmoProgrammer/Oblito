import { Router } from 'express';

import { protect } from "../middleware/auth-middleware.js";
import { checkRole } from '../middleware/role-middleware.js';

import { handleGetMe, handleGetUploadUrl, handlePatchMe, handleGetShop, handleGetWarehouse, handlePatchShop, handlePatchWarehouse } from '../controllers/user-controller.js';

const router = Router();

router.get('/me', protect, handleGetMe);

router.patch('/me', protect, handlePatchMe);

router.get('/me/upload-url', protect, handleGetUploadUrl);

router.get('/me/shop', protect, checkRole(['retailer']), handleGetShop);

router.patch('/me/shop', protect, checkRole(['retailer']), handlePatchShop);

router.get('/me/warehouse', protect, checkRole(['wholesaler']), handleGetWarehouse);

router.patch('/me/warehouse', protect, checkRole(['wholesaler']), handlePatchWarehouse);

export default router;