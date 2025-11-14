import { Router } from 'express';

import { handleGetAllCategories } from '../controllers/category-controller.js';

const router = Router();

router.get('/categories', handleGetAllCategories);

export default router;