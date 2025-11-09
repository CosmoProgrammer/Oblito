import { Router } from 'express';
import { z } from 'zod';

import db from '../db/index.js';

import { protect } from "../middleware/auth-middleware.js";
import { checkRole } from '../middleware/role-middleware.js';

const router = Router();

router.get('/inventory', protect, checkRole(['retailer', 'wholesaler']), async (req, res) => {
    try {
        res.json({ message: 'Inventory data access granted.' });
    } catch (e) {
        console.error('Error fetching inventory:', e);
        res.status(500).json({ message: 'Internal server error' });
    }
});

export default router;