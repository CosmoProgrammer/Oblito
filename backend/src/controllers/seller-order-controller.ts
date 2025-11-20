import { z } from 'zod';

import db from '../db/index.js';
import { and, eq } from 'drizzle-orm';

import { orders } from '../db/schema/orders.js';
import { shops } from '../db/schema/shops.js';
import { warehouses } from '../db/schema/warehouses.js';
import { orderItems } from '../db/schema/orderItems.js';
import { users } from '../db/schema/users.js';

import { updateOrderItemStatusSchema, updatePaymentStatusSchema, orderIdParamSchema, orderItemIdParamSchema } from '../validation/seller-order-validation.js';

export const handleGetSellerOrders = async (req: any, res: any) => {
    try {
        const user = req.user as { id: string, role: 'retailer' | 'wholesaler' };

        let sellerOrders;

        if (user.role === 'retailer') {
            const shop = await db.query.shops.findFirst({
                where: eq(shops.ownerId, user.id)
            });
            if (!shop) return res.status(404).json({ message: "Shop not found" });

            sellerOrders = await db.query.orders.findMany({
                where: eq(orders.shopId, shop.id),
                with: {
                    customer: {
                        columns: {
                            firstName: true,
                            lastName: true,
                            email: true,
                        }
                    },
                    deliveryAddress: true,
                    orderItems: {
                        with: {
                            shopInventory: {
                                with: {
                                    product: true
                                }
                            }
                        }
                    }
                },
                orderBy: (orders, { desc }) => [desc(orders.createdAt)],
            });
        } else if (user.role === 'wholesaler') {
            const warehouse = await db.query.warehouses.findFirst({
                where: eq(warehouses.ownerId, user.id)
            });
            if (!warehouse) return res.status(404).json({ message: "Warehouse not found" });

            sellerOrders = await db.query.orders.findMany({
                where: eq(orders.warehouseId, warehouse.id),
                with: {
                    customer: {
                        columns: {
                            firstName: true,
                            lastName: true,
                            email: true,
                        }
                    },
                    deliveryAddress: true,
                    orderItems: {
                        with: {
                            warehouseInventory: {
                                with: {
                                    product: true
                                }
                            }
                        }
                    }
                },
                orderBy: (orders, { desc }) => [desc(orders.createdAt)],
            });
        } else {
            return res.status(403).json({ message: "Unauthorized" });
        }

        res.json(sellerOrders);

    } catch (e) {
        console.error('Error fetching seller orders:', e);
        res.status(500).json({ message: 'Internal server error' });
    }
};


export const handleUpdateOrderItemStatus = async (req: any, res: any) => {
    try {
        const user = req.user as { id: string, role: 'retailer' | 'wholesaler' };
        const { orderItemId } = orderItemIdParamSchema.parse(req.params);
        const { status } = updateOrderItemStatusSchema.parse(req.body);

        const item = await db.query.orderItems.findFirst({
            where: eq(orderItems.id, orderItemId),
            with: {
                order: true
            }
        });

        if (!item) {
            return res.status(404).json({ message: "Order item not found" });
        }

        // Authorization check
        if (user.role === 'retailer') {
            const shop = await db.query.shops.findFirst({ where: eq(shops.ownerId, user.id) });
            if (item.order.shopId !== shop?.id) {
                return res.status(403).json({ message: "Unauthorized to update this item" });
            }
        } else if (user.role === 'wholesaler') {
            const warehouse = await db.query.warehouses.findFirst({ where: eq(warehouses.ownerId, user.id) });
            if (item.order.warehouseId !== warehouse?.id) {
                return res.status(403).json({ message: "Unauthorized to update this item" });
            }
        } else {
             return res.status(403).json({ message: "Unauthorized" });
        }
        
        await db.update(orderItems)
            .set({ status: status })
            .where(eq(orderItems.id, orderItemId));

        // Update overall order status
        const orderId = item.orderId;
        const allItems = await db.query.orderItems.findMany({
            where: eq(orderItems.orderId, orderId)
        });

        const allDelivered = allItems.every(i => i.status === 'delivered');
        if (allDelivered) {
            await db.update(orders).set({ status: 'delivered' }).where(eq(orders.id, orderId));
        } else {
            const allProcessedOrMore = allItems.every(i => i.status === 'processed' || i.status === 'shipped' || i.status === 'delivered');
            if (allProcessedOrMore) {
                const currentOrder = await db.query.orders.findFirst({ where: eq(orders.id, orderId), columns: { status: true } });
                if (currentOrder && currentOrder.status === 'pending') {
                    await db.update(orders).set({ status: 'processed' }).where(eq(orders.id, orderId));
                }
            }
        }

        res.json({ message: "Order item status updated successfully" });

    } catch (e) {
        if (e instanceof z.ZodError) {
            return res.status(400).json({ errors: e.issues });
        }
        console.error('Error updating order item status:', e);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const handleUpdatePaymentStatus = async (req: any, res: any) => {
    try {
        const user = req.user as { id: string, role: 'retailer' | 'wholesaler' };
        const { orderId } = orderIdParamSchema.parse(req.params);
        const { paymentStatus } = updatePaymentStatusSchema.parse(req.body);

        const order = await db.query.orders.findFirst({
            where: eq(orders.id, orderId)
        });

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        // Authorization
        if (user.role === 'retailer') {
            const shop = await db.query.shops.findFirst({ where: eq(shops.ownerId, user.id) });
            if (order.shopId !== shop?.id) {
                return res.status(403).json({ message: "Unauthorized" });
            }
        } else if (user.role === 'wholesaler') {
            const warehouse = await db.query.warehouses.findFirst({ where: eq(warehouses.ownerId, user.id) });
            if (order.warehouseId !== warehouse?.id) {
                return res.status(403).json({ message: "Unauthorized" });
            }
        } else {
             return res.status(403).json({ message: "Unauthorized" });
        }

        if (order.paymentMethod !== 'cash_on_delivery') {
            return res.status(400).json({ message: "Can only update payment status for Cash on Delivery orders." });
        }

        await db.update(orders)
            .set({ paymentStatus: paymentStatus })
            .where(eq(orders.id, orderId));

        res.json({ message: "Payment status updated successfully" });

    } catch (e) {
        if (e instanceof z.ZodError) {
            return res.status(400).json({ errors: e.issues });
        }
        console.error('Error updating payment status:', e);
        res.status(500).json({ message: 'Internal server error' });
    }
}
