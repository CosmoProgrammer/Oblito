import { Router } from 'express';

import { protect } from "../middleware/auth-middleware.js";
import { checkRole } from '../middleware/role-middleware.js';

import { handleGetMe, handleGetUploadUrl, handlePatchMe } from '../controllers/user-controller.js';

const router = Router();

router.get('/me', protect, handleGetMe);

router.patch('/me', protect, handlePatchMe);

router.get('/me/upload-url', protect, handleGetUploadUrl);

export default router;