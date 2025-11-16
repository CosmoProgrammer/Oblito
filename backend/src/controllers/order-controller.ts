import db from '../db/index.js';
import { addresses } from '../db/schema/addresses.js';
import { shops } from '../db/schema/shops.js';
import { warehouses } from '../db/schema/warehouses.js';
import { orders } from '../db/schema/orders.js';
import { carts } from '../db/schema/carts.js';
import { cartItems } from '../db/schema/cartItems.js';
import { orderItems } from '../db/schema/orderItems.js';

import { createOrderSchema, orderIdParamSchema } from '../validation/order-validation.js';

import { z } from 'zod';
import { eq, and, inArray, sql } from 'drizzle-orm';
import { shopInventory } from '../db/schema/shopInventory.js';

export const handlePostOrder = async (req: any, res: any) => {
    try {
        const user = req.user as { 
            id: string, 
            email: string, 
            profilePictureUrl: string | null, 
            firstName: string, 
            lastName: string, 
            role: 'customer' | 'retailer' | 'wholesaler' 
        };

        const { deliveryAddressId, paymentMethod } = createOrderSchema.parse(req.body);

        const address = await db.query.addresses.findFirst({
            where: and(eq(addresses.id, deliveryAddressId), eq(addresses.userId, user.id))
        });
        if (!address) return res.status(400).json({ message: "Invalid delivery address" });

        const userCart = await db.query.carts.findFirst({
            where: eq(carts.customerId, user.id),
            with: {
                cartItems: {
                    with: {
                        shopInventory: true
                    }
                }
            }
        });

        if (!userCart || userCart.cartItems.length === 0) {
            return res.status(400).json({ message: "Cart is empty" });
        }

        const itemsByShop = new Map();

        for(const item of userCart.cartItems) {
            const shopId = item.shopInventory.shopId;
            if(!itemsByShop.has(shopId)) {
                itemsByShop.set(shopId, []);
            };
            itemsByShop.get(shopId).push(item);
        }

        const createdOrderIds = await db.transaction(async (tx) => {
            const orderIds = [];
            for(const [shopId, items] of itemsByShop) {
                let shopTotal = 0;
                for(const item of items) {
                    const qty = parseFloat(item.quantity.toString());
                    const stock = parseFloat(item.shopInventory.stockQuantity.toString());
                    const price = parseFloat(item.shopInventory.price.toString());

                    if (qty > stock) {
                        throw new Error(`Insufficient stock for item with id ${item.shopInventoryId}`);
                    }
                    shopTotal += qty * price;
                }

                const newOrder = await tx.insert(orders).values({
                    customerId: user.id,
                    orderType: 'retail',
                    shopId: shopId,
                    status: 'pending',
                    totalAmount: shopTotal.toString(),
                    paymentMethod: paymentMethod,
                    deliveryAddressId: deliveryAddressId,
                }).returning();

                const orderId = newOrder[0]!.id;
                orderIds.push(orderId);

                for(const item of items) {
                    await tx.insert(orderItems).values({
                        orderId: orderId,
                        shopInventoryId: item.shopInventoryId,
                        quantity: item.quantity,
                        priceAtPurchase: item.shopInventory.price,
                        status: 'pending',
                    })

                    await tx.update(shopInventory).set({
                        stockQuantity: sql`${shopInventory.stockQuantity} - ${item.quantity}`
                    }).where(eq(shopInventory.id, item.shopInventoryId));
                }
            }

            await tx.delete(cartItems).where(eq(cartItems.cartId, userCart.id));

            return orderIds;
        })

        res.status(201).json({ 
            message: "Order placed successfully", 
            generatedOrders: createdOrderIds.length,
            orderIds: createdOrderIds 
        });

    } catch (e) {
        if (e instanceof z.ZodError) {
            return res.status(400).json({ errors: e.issues });
        }
        console.error('Error posting order:', e);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const handleGetOrders = async (req: any, res: any) => {
    try {
        const user = req.user as { 
            id: string, 
            email: string, 
            profilePictureUrl: string | null, 
            firstName: string, 
            lastName: string, 
            role: 'customer' | 'retailer' | 'wholesaler' 
        };

        const myOrders = await db.query.orders.findMany({
            where: eq(orders.customerId, user.id),
            orderBy: (orders, { desc }) => [desc(orders.createdAt)],
            with: {
                shop: { columns: { name: true } },
                orderItems: {
                    with: {
                        shopInventory: {
                            with: {
                                product: {
                                    columns: { name: true, imageURLs: true }
                                }
                            }
                        }
                    }
                }
            }
        });

        console.log('Fetched orders:', myOrders);

        res.json({ orders: myOrders });
    } catch (e) {
        if (e instanceof z.ZodError) {
            return res.status(400).json({ errors: e.issues });
        }
        console.error('Error posting order:', e);
        res.status(500).json({ message: 'Internal server error' });
    }
}