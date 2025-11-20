import { z } from 'zod';
import db from '../db/index.js';
import { and, eq, sql } from 'drizzle-orm';
import { orderItems } from '../db/schema/orderItems.js';
import { orders } from '../db/schema/orders.js';
import { shops } from '../db/schema/shops.js';
import { users } from '../db/schema/users.js';
import { products } from '../db/schema/products.js';
import { shopInventory } from '../db/schema/shopInventory.js';
import { requestReturnSchema, updateReturnStatusSchema, returnIdParamSchema } from '../validation/return-validation.js';

export const handlePostReturnRequest = async (req: any, res: any) => {
    try {
        const user = req.user as { id: string };
        const { orderItemId } = requestReturnSchema.parse(req.body);

        const item = await db.query.orderItems.findFirst({
            where: eq(orderItems.id, orderItemId),
            with: {
                order: true
            }
        });

        if (!item || item.order.customerId !== user.id) {
            return res.status(404).json({ message: "Order item not found or you are not authorized to access it." });
        }

        if (item.status !== 'delivered') {
            return res.status(400).json({ message: `Item cannot be returned as it is not delivered yet. Current status: ${item.status}` });
        }

        await db.update(orderItems)
            .set({ status: 'to_return' })
            .where(eq(orderItems.id, orderItemId));

        res.status(200).json({ message: "Return requested successfully." });

    } catch (e) {
        if (e instanceof z.ZodError) {
            return res.status(400).json({ errors: e.issues });
        }
        console.error('Error requesting return:', e);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const handleGetReturnRequests = async (req: any, res: any) => {
    try {
        const user = req.user as { id: string, role: 'retailer' };

        const shop = await db.query.shops.findFirst({
            where: eq(shops.ownerId, user.id)
        });

        if (!shop) {
            return res.status(404).json({ message: "Shop not found for the retailer." });
        }

        const results = await db.select({
                orderItem: orderItems,
                order: orders,
                customer: {
                    firstName: users.firstName,
                    lastName: users.lastName,
                    email: users.email
                },
                shopInventory: shopInventory,
                product: products
            })
            .from(orderItems)
            .innerJoin(orders, eq(orderItems.orderId, orders.id))
            .innerJoin(users, eq(orders.customerId, users.id))
            .leftJoin(shopInventory, eq(orderItems.shopInventoryId, shopInventory.id))
            .leftJoin(products, eq(shopInventory.productId, products.id))
            .where(and(
                eq(orderItems.status, 'to_return'),
                eq(orders.shopId, shop.id)
            ));

        const returnRequests = results.map(r => ({
            ...r.orderItem,
            order: {
                ...r.order,
                customer: r.customer
            },
            shopInventory: {
                ...r.shopInventory,
                product: r.product
            }
        }));

        res.status(200).json(returnRequests);

    } catch (e) {
        console.error('Error fetching return requests:', e);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const handleUpdateReturnStatus = async (req: any, res: any) => {
    try {
        const user = req.user as { id: string, role: 'retailer' };
        const { returnId } = returnIdParamSchema.parse(req.params);
        const { status } = updateReturnStatusSchema.parse(req.body);

        const itemToReturn = await db.query.orderItems.findFirst({
            where: eq(orderItems.id, returnId),
            with: {
                order: true,
            }
        });

        if (!itemToReturn) {
            return res.status(404).json({ message: "Return item not found." });
        }

        const shop = await db.query.shops.findFirst({
            where: eq(shops.ownerId, user.id)
        });

        if (!shop || itemToReturn.order.shopId !== shop.id) {
            return res.status(403).json({ message: "You are not authorized to update this return status." });
        }
        
        if (itemToReturn.status !== 'to_return') {
            return res.status(400).json({ message: `Cannot mark as returned. Current status: ${itemToReturn.status}`});
        }

        await db.transaction(async (tx) => {
            await tx.update(orderItems)
                .set({ status: 'returned' })
                .where(eq(orderItems.id, returnId));

            if (itemToReturn.shopInventoryId) {
                await tx.update(shopInventory)
                    .set({ stockQuantity: sql`${shopInventory.stockQuantity} + ${itemToReturn.quantity}` })
                    .where(eq(shopInventory.id, itemToReturn.shopInventoryId));
            }
        });

        res.status(200).json({ message: "Item marked as returned and stock updated." });

    } catch (e) {
        if (e instanceof z.ZodError) {
            return res.status(400).json({ errors: e.issues });
        }
        console.error('Error updating return status:', e);
        res.status(500).json({ message: 'Internal server error' });
    }
};