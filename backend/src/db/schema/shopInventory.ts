import { pgTable, uuid, numeric, boolean, unique } from 'drizzle-orm/pg-core';
import { shops } from './shops.js';
import { products } from './products.js';
import { warehouseInventory } from './warehouseInventory.js';

export const shopInventory = pgTable('shop_inventory', {
    id: uuid('id').primaryKey().defaultRandom(),
    shopId: uuid('shop_id').notNull().references(() => shops.id, { onDelete: 'cascade' }),
    productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
    price: numeric('price').notNull(),
    stockQuantity: numeric('stock_quantity').notNull().default('0'),
    isProxyItem: boolean('is_proxy_item').notNull().default(false),
    warehouseInventoryId: uuid('warehouse_inventory_id').references(() => warehouseInventory.id, { onDelete: 'set null' }),
}, (table) => {
    return {
        uniqueShopProduct: unique().on(table.shopId, table.productId),
    };
});

export const shopInventorySchema = {
    shopInventory,
};