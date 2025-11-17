import { pgTable, text, uuid, pgEnum, numeric, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { orderItems } from './orderItems.js';
import { users } from './users.js';
import { shops } from './shops.js';
import { addresses } from './addresses.js';
import  { warehouses } from './warehouses.js';

export const orderTypeEnum = pgEnum('order_type', ['retail', 'wholesale']);
export const fullOrderStatusEnum = pgEnum('full_order_status', ['pending', 'processed', 'delivered', 'cancelled']);
export const paymentMethodEnum = pgEnum('payment_method', ['credit_card', 'upi', 'cash_on_delivery']);
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'completed', 'failed']);

export const orders = pgTable('orders', {
    id: uuid('id').primaryKey().defaultRandom(),
    customerId: uuid('customer_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    orderType: orderTypeEnum('order_type').notNull(), //'retail' or 'wholesale'
    shopId: uuid('shop_id').references(() => shops.id, { onDelete: 'set null' }),
    warehouseId: uuid('warehouse_id').references(() => warehouses.id, { onDelete: 'set null' }),
    status: fullOrderStatusEnum('status').notNull().default('pending'),
    totalAmount: numeric('total_amount').notNull(),
    paymentMethod: paymentMethodEnum('payment_method').notNull(),
    paymentStatus: paymentStatusEnum('payment_status').notNull().default('pending'),
    deliveryAddressId: uuid('delivery_address_id').references(() => addresses.id, { onDelete: 'restrict' }),
    offlineOrderDeliveryDate: timestamp('offline_order_delivery_date', { withTimezone: true, mode: 'date' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow(),
});

export const ordersRelations = relations(orders, ({ one, many }) => ({
    shop: one(shops, {
        fields: [orders.shopId],
        references: [shops.id],
    }),
    warehouse: one(warehouses, {
        fields: [orders.warehouseId],
        references: [warehouses.id],
    }),
    orderItems: many(orderItems),
}));

export const ordersSchema = {
    orders,
    orderTypeEnum,
    fullOrderStatusEnum,
    paymentMethodEnum,
    paymentStatusEnum,
    ordersRelations,
};
