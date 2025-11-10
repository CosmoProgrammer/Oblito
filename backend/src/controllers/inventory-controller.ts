import db from '../db/index.js';

export const handleGetInventory = async (req: any, res: any) => {
    try {
        res.json({ message: 'Inventory data access granted.' });
    } catch (e) {
        console.error('Error fetching inventory:', e);
        res.status(500).json({ message: 'Internal server error' });
    }  
};