import { Router } from 'express';

import db from '../db/index.js';
import { categories } from '../db/schema/categories.js';

const router = Router();

router.get('/categories', async (req, res) => {
    try {
        const allCategories = await db.select().from(categories);
        res.json(allCategories);
    } catch (e) {
        console.error('Error fetching categories:', e);
        res.status(500).json({ message: 'Internal server error' });
    }
});

export default router;