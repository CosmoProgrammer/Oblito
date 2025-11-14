import db from '../db/index.js';
import { categories } from '../db/schema/categories.js';

export const handleGetAllCategories = async (req: any, res: any) => {
    try {
        const allCategories = await db.select().from(categories);
        res.json(allCategories);
    } catch (e) {
        console.error('Error fetching categories:', e);
        res.status(500).json({ message: 'Internal server error' });
    }
};