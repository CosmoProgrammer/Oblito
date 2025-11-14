import { pgTable, uuid, numeric, unique } from 'drizzle-orm/pg-core';
import { carts } from './carts.js';
import { shopInventory } from './shopInventory.js';

export const cartItems = pgTable('cart_items', {
    id: uuid('id').primaryKey().defaultRandom(),
    cartId: uuid('cart_id').notNull().references(() => carts.id, { onDelete: 'cascade' }),
    shopInventoryId: uuid('shop_inventory_id').notNull().references(() => shopInventory.id, { onDelete: 'cascade' }),
    quantity: numeric('quantity').notNull(),
}, (table) => {
    return {
        uniqueCartItem: unique().on(table.cartId, table.shopInventoryId),
    };
});

export const cartItemsSchema = {
    cartItems,
};