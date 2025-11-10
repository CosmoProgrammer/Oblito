import { z } from 'zod';

import db from '../db/index.js';
import { shops } from '../db/schema/shops.js';
import { warehouseInventory } from '../db/schema/warehouseInventory.js';
import { shopInventory } from '../db/schema/shopInventory.js';
import { eq } from 'drizzle-orm';

import { createListingSchema } from '../validation/inventory-validation.js';

export const handleGetInventory = async (req: any, res: any) => {
    try {
        res.json({ message: 'Inventory data access granted.' });
    } catch (e) {
        console.error('Error fetching inventory:', e);
        res.status(500).json({ message: 'Internal server error' });
    }  
};

export const handleCreateRetailListing = async (req: any, res: any) => {
    try {
        const user = req.user as { 
            id: string, 
            email: string, 
            profilePictureUrl: string | null, 
            firstName: string, 
            lastName: string, 
            role: 'customer' | 'retailer' | 'wholesaler' 
        }; 

        const { warehouseInventoryId, price, isProxyItem, stockQuantity } = createListingSchema.parse(req.body);

        const newListing= await db.transaction(async (tx) => {
            const shop = await tx.query.shops.findFirst({
                where: eq(shops.ownerId, user.id),
            });
            if (!shop) { throw new Error('Retailer shop not found')};

            const sourceItem = await tx.query.warehouseInventory.findFirst({
                where: eq(warehouseInventory.id, warehouseInventoryId)
            });
            if (!sourceItem) { throw new Error('Source warehouse inventory item not found')};

            const sourceStock = parseInt(sourceItem.stockQuantity);
            if (sourceStock < stockQuantity) {
                throw new Error('Insufficient stock in warehouse inventory');
            }

            await tx.update(warehouseInventory).set({
                stockQuantity: (sourceStock - stockQuantity).toString()
            }).where(eq(warehouseInventory.id, warehouseInventoryId));

            const newShopListing = await tx.insert(shopInventory).values({
                shopId: shop.id,
                productId: sourceItem.productId,
                stockQuantity: stockQuantity.toString(),
                price: price.toString(),
                isProxyItem: isProxyItem,
                warehouseInventoryId: warehouseInventoryId,
            }).returning();

            return newShopListing[0];
        });

        res.status(201).json(newListing);
    } catch (e) {
        console.log('Error creating product:', e);
        if (e instanceof z.ZodError) {
            return res.status(400).json({ errors: e.issues });
        }
        console.error('Error fetching product by ID:', e);
        
        res.status(500).json({ message: e })
    }
};