import { Router } from 'express';
import { protect } from "../middleware/auth-middleware.js";
import { checkRole } from '../middleware/role-middleware.js';
import { handlePostReturnRequest, handleGetReturnRequests, handleUpdateReturnStatus } from '../controllers/return-controller.js';

const router = Router();

router.post('/returns/request', protect, checkRole(['customer']), handlePostReturnRequest);

router.get('/returns', protect, checkRole(['retailer']), handleGetReturnRequests);

router.patch('/returns/:returnId', protect, checkRole(['retailer']), handleUpdateReturnStatus);

export default router;