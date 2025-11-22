import db from '../db/index.js';
import { addresses } from '../db/schema/addresses.js';
import { shops } from '../db/schema/shops.js';
import { warehouses } from '../db/schema/warehouses.js';
import { orders } from '../db/schema/orders.js';
import { carts } from '../db/schema/carts.js';
import { cartItems } from '../db/schema/cartItems.js';
import { orderItems } from '../db/schema/orderItems.js';
import { warehouseInventory } from '../db/schema/warehouseInventory.js';
import razorpayInstance from '../services/razorpay-service.js';
import crypto from 'crypto';

import { createOrderSchema, orderIdParamSchema, createWholesaleOrderSchema } from '../validation/order-validation.js';

import { z } from 'zod';
import { eq, and, inArray, sql } from 'drizzle-orm';
import { shopInventory } from '../db/schema/shopInventory.js';

export const handleCreateRazorpayOrder = async (req: any, res: any) => {
    try {
        const user = req.user as { id: string, email: string };

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

        let totalAmount = 0;
        for (const item of userCart.cartItems) {
            const qty = parseFloat(item.quantity.toString());
            const price = parseFloat(item.shopInventory.price.toString());
            totalAmount += qty * price;
        }

        // Add 8% tax
        totalAmount = totalAmount * 1.08;

        const options = {
            amount: Math.round(totalAmount * 100), // amount in the smallest currency unit
            currency: "INR",
            receipt: `receipt_order_${new Date().getTime()}`,
        };

        const order = await razorpayInstance.orders.create(options);
        res.json({ order });

    } catch (e) {
        console.error('Error creating Razorpay order:', e);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const handleVerifyPayment = async (req: any, res: any) => {
    try {
        const user = req.user as { 
            id: string, 
            email: string, 
            profilePictureUrl: string | null, 
            firstName: string, 
            lastName: string, 
            role: 'customer' | 'retailer' | 'wholesaler' 
        };
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, deliveryAddressId, paymentMethod } = req.body;

        const body = razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
            .update(body.toString())
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ message: "Invalid payment signature" });
        }

        // Payment is verified, now create the order
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
        for (const item of userCart.cartItems) {
            const shopId = item.shopInventory.shopId;
            if (!itemsByShop.has(shopId)) {
                itemsByShop.set(shopId, []);
            }
            itemsByShop.get(shopId).push(item);
        }

        const createdOrderIds = await db.transaction(async (tx) => {
            const orderIds = [];
            for (const [shopId, items] of itemsByShop) {
                let shopTotal = 0;
                for (const item of items) {
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
                    paymentId: razorpay_payment_id,
                    paymentStatus: 'completed'
                }).returning();

                const orderId = newOrder[0]!.id;
                orderIds.push(orderId);

                for (const item of items) {
                    await tx.insert(orderItems).values({
                        orderId: orderId,
                        shopInventoryId: item.shopInventoryId,
                        warehouseInventoryId: item.shopInventory.warehouseInventoryId,
                        quantity: item.quantity,
                        priceAtPurchase: item.shopInventory.price,
                        status: 'pending',
                    });

                    await tx.update(shopInventory).set({
                        stockQuantity: sql`${shopInventory.stockQuantity} - ${item.quantity}`
                    }).where(eq(shopInventory.id, item.shopInventoryId));
                }
            }

            await tx.delete(cartItems).where(eq(cartItems.cartId, userCart.id));

            return orderIds;
        });

        res.status(201).json({ 
            message: "Order placed successfully", 
            generatedOrders: createdOrderIds.length,
            orderIds: createdOrderIds 
        });

    } catch (e) {
        console.error('Error verifying payment:', e);
        res.status(500).json({ message: 'Internal server error' });
    }
};

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
                        warehouseInventoryId: item.shopInventory.warehouseInventoryId,
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
        console.log('Error in posting order:', e);
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
        console.error('Error getting orders:', e);
        res.status(500).json({ message: 'Internal server error' });
    }
}

export const handleDeleteOrder = async (req: any, res: any) => {
    try {
        const user = req.user as { 
            id: string, 
            email: string, 
            profilePictureUrl: string | null, 
            firstName: string, 
            lastName: string, 
            role: 'customer' | 'retailer' | 'wholesaler' 
        };
        const { orderId } = orderIdParamSchema.parse({orderId: req.params.id});

        console.log('Attempting to cancel order:', orderId, 'for user:', user.id);

        const order = await db.query.orders.findFirst({
            where: and(eq(orders.id, orderId), eq(orders.customerId, user.id)),
            with: {
                orderItems: true
            }
        });

        if (!order) return res.status(404).json({ message: "Order not found" });

        if (order.status === 'delivered' || order.status === 'cancelled') {
            return res.status(400).json({ message: `Cannot cancel order with status: ${order.status}` });
        }

        await db.transaction(async (tx) => {
            await tx.update(orders)
                .set({ status: 'cancelled' })
                .where(eq(orders.id, orderId));
            
            await tx.update(orderItems)
                .set({ status: 'cancelled' })
                .where(eq(orderItems.orderId, orderId));

            for (const item of order.orderItems) {
                if (item.shopInventoryId) {
                    await tx.update(shopInventory)
                        .set({ 
                            stockQuantity: sql`${shopInventory.stockQuantity} + ${item.quantity}` 
                        })
                        .where(eq(shopInventory.id, item.shopInventoryId));
                }
            }
        });

        res.json({ message: "Order cancelled successfully" });
    } catch (e) {
        console.log('Error in deleting order:', e);
        if (e instanceof z.ZodError) {
            return res.status(400).json({ errors: e.issues });
        }
        console.error('Error deleting order:', e);
        res.status(500).json({ message: 'Internal server error' });
    }
}

export const handlePostWholesaleOrder = async (req: any, res: any) => {
    try {
        const user = req.user as { 
            id: string, 
            email: string, 
            profilePictureUrl: string | null, 
            firstName: string, 
            lastName: string, 
            role: 'customer' | 'retailer' | 'wholesaler' 
        };

        const { warehouseInventoryId, quantity, paymentMethod, isProxyItem } = createWholesaleOrderSchema.parse(req.body);

        const result = await db.transaction(async (tx) => {
            const wItem = await tx.query.warehouseInventory.findFirst({
                where: eq(warehouseInventory.id, warehouseInventoryId),
                with: {
                    warehouse: true
                }
            })

            if (!wItem) throw new Error("Warehouse item not found");

            const availableStock = parseFloat(wItem.stockQuantity);
            if (availableStock < quantity) {
                throw new Error(`Insufficient wholesale stock. Available: ${availableStock}`);
            }

            const shop = await tx.query.shops.findFirst({
                where: eq(shops.ownerId, user.id)
            });
            if (!shop) throw new Error("Retailer shop not found");

            const orderStatus = isProxyItem ? 'delivered' : 'pending';
            const deliveryDate = isProxyItem ? new Date() : null;

            const totalAmount = (parseFloat(wItem.price) * quantity).toString();

            const [newOrder] = await tx.insert(orders).values({
                customerId: user.id,
                orderType: 'wholesale',
                warehouseId: wItem.warehouse.id,
                status: orderStatus,
                paymentMethod: paymentMethod,
                totalAmount: totalAmount,
                offlineOrderDeliveryDate: deliveryDate,
            }).returning();
            
            if(!newOrder) throw new Error("Failed to create order");

            await tx.insert(orderItems).values({
                orderId: newOrder.id,
                warehouseInventoryId: wItem.id,
                quantity: quantity.toString(),
                priceAtPurchase: wItem.price,
                status: orderStatus
            });

            await tx.update(warehouseInventory).set({
                    stockQuantity: sql`${warehouseInventory.stockQuantity} - ${quantity}`
                })
                .where(eq(warehouseInventory.id, wItem.id));

            if(isProxyItem) {
                const existingShopItem = await tx.query.shopInventory.findFirst({
                    where: and(
                        eq(shopInventory.shopId, shop.id),
                        eq(shopInventory.productId, wItem.productId)
                    )
                });
                if (existingShopItem) {
                    await tx.update(shopInventory)
                        .set({
                            stockQuantity: sql`${shopInventory.stockQuantity} + ${quantity}`,
                            warehouseInventoryId: wItem.id,
                            isProxyItem: true
                        })
                        .where(eq(shopInventory.id, existingShopItem.id));
                } else {
                    await tx.insert(shopInventory).values({
                        shopId: shop.id,
                        productId: wItem.productId,
                        warehouseInventoryId: wItem.id,
                        stockQuantity: quantity.toString(),
                        price: wItem.price,
                        isProxyItem: true
                    });

                }
            }
            return newOrder;
        });

        res.status(201).json({ 
            message: "Wholesale order placed successfully", 
            order: result 
        });
        
    } catch (e) {
        console.log('Error in placing wholesale order:', e);
        if (e instanceof z.ZodError) {
            return res.status(400).json({ errors: e.issues });
        }
        console.error('Error placing wholesale order:', e);
        res.status(500).json({ message: 'Internal server error' });
    }
}

export const handleGetWholesaleOrders = async (req: any, res: any) => {
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
            where: and(
                eq(orders.customerId, user.id), 
                eq(orders.orderType, 'wholesale')
            ),
            orderBy: (orders, { desc }) => [desc(orders.createdAt)],
            with: {
                warehouse: { columns: { name: true } }, 
                orderItems: {
                    with: {
                        warehouseInventory: {
                            with: {
                                product: { columns: { name: true, imageURLs: true } }
                            }
                        }
                    }
                }
            }
        });

        res.json({ orders: myOrders });
    } catch (e) {
        console.log('Error in getting wholesale orders:', e);
        if (e instanceof z.ZodError) {
            return res.status(400).json({ errors: e.issues });
        }
        console.error('Error in getting wholesale orders:', e);
        res.status(500).json({ message: 'Internal server error' });
    }
}

export const handleDeleteWholesaleOrder = async (req: any, res: any) => {
    try {
        const user = req.user as { 
            id: string, 
            email: string, 
            profilePictureUrl: string | null, 
            firstName: string, 
            lastName: string, 
            role: 'customer' | 'retailer' | 'wholesaler' 
        };
        const orderId = req.params.id;
        const order = await db.query.orders.findFirst({
            where: and(
                eq(orders.id, orderId), 
                eq(orders.customerId, user.id),
                eq(orders.orderType, 'wholesale')
            ),
            with: { orderItems: true }
        });

        if (!order) return res.status(404).json({ message: "Order not found" });

        if (order.status !== 'pending') {
            return res.status(400).json({ 
                message: `Cannot cancel order. Status is '${order.status}'. Proxy orders cannot be cancelled.` 
            });
        }

        await db.transaction(async (tx) => {
            await tx.update(orders).set({ status: 'cancelled' }).where(eq(orders.id, orderId));
            await tx.update(orderItems).set({ status: 'cancelled' }).where(eq(orderItems.orderId, orderId));

            for (const item of order.orderItems) {
                if (item.warehouseInventoryId) {
                    await tx.update(warehouseInventory)
                        .set({ 
                            stockQuantity: sql`${warehouseInventory.stockQuantity} + ${item.quantity}` 
                        })
                        .where(eq(warehouseInventory.id, item.warehouseInventoryId));
                }
            }
        });

        res.json({ message: "Wholesale order cancelled" });
    } catch (e) {
        console.log('Error in deleting wholesale order:', e);
        if (e instanceof z.ZodError) {
            return res.status(400).json({ errors: e.issues });
        }
        console.error('Error in deleting wholesale order:', e);
        res.status(500).json({ message: 'Internal server error' });
    }
}