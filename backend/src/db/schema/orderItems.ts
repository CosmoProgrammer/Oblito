import { pgTable, text, uuid, numeric, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { orders } from './orders.js';
import { shopInventory } from './shopInventory.js';
import { warehouseInventory } from './warehouseInventory.js';

export const orderStatusEnum = pgEnum('order_status', ['pending', 'processed', 'shipped', 'delivered', 'cancelled', 'to_return', 'returned']);

export const orderItems = pgTable('order_items', {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
    shopInventoryId: uuid('shop_inventory_id').references(() => shopInventory.id, { onDelete: 'set null' }),
    warehouseInventoryId: uuid('warehouse_inventory_id').references(() => warehouseInventory.id, { onDelete: 'set null' }),
    quantity: numeric('quantity').notNull(),
    priceAtPurchase: numeric('price_at_purchase').notNull(),
    status: orderStatusEnum('status').notNull().default('pending'),
});

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
    order: one(orders, {
        fields: [orderItems.orderId],
        references: [orders.id],
    }),
    shopInventory: one(shopInventory, {
        fields: [orderItems.shopInventoryId],
        references: [shopInventory.id],
    }),
    warehouseInventory: one(warehouseInventory, {
        fields: [orderItems.warehouseInventoryId],
        references: [warehouseInventory.id],
    }),
}));

export const orderItemsSchema = {
    orderItems,
    orderItemsRelations,
};
