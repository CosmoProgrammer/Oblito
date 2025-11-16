import { pgTable, text, uuid, numeric, pgEnum } from 'drizzle-orm/pg-core';
import { orders } from './orders.js';
import { shopInventory } from './shopInventory.js';
import { warehouseInventory } from './warehouseInventory.js';

export const orderStatusEnum = pgEnum('order_status', ['pending', 'processed', 'shipped', 'delivered', 'cancelled']);

export const orderItems = pgTable('order_items', {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
    shopInventoryId: uuid('shop_inventory_id').references(() => shopInventory.id, { onDelete: 'set null' }),
    warehouseInventoryId: uuid('warehouse_inventory_id').references(() => warehouseInventory.id, { onDelete: 'set null' }),
    quantity: numeric('quantity').notNull(),
    priceAtPurchase: numeric('price_at_purchase').notNull(),
    status: orderStatusEnum('status').notNull().default('pending'),
});

export const orderItemsSchema = {
    orderItems,
};
