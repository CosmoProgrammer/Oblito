import { relations } from 'drizzle-orm';
import { pgTable, uuid, numeric, boolean, unique } from 'drizzle-orm/pg-core';
import { shops } from './shops.js';
import { products } from './products.js';
import { warehouseInventory } from './warehouseInventory.js';

export const shopInventory = pgTable('shop_inventory', {
    id: uuid('id').primaryKey().defaultRandom(),
    shopId: uuid('shop_id').notNull().references(() => shops.id, { onDelete: 'cascade' }),
    productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
    stockQuantity: numeric('stock_quantity').notNull().default('0'),
    isProxyItem: boolean('is_proxy_item').notNull().default(false),
    warehouseInventoryId: uuid('warehouse_inventory_id').references(() => warehouseInventory.id, { onDelete: 'set null' }),
    price: numeric('price').notNull(),
}, (table) => {
    return {
        uniqueShopProduct: unique().on(table.shopId, table.productId),
    };
});

export const shopInventoryRelations = relations(shopInventory, ({ one }) => ({
    product: one(products, {
        fields: [shopInventory.productId],
        references: [products.id],
    }),
    shop: one(shops, {
        fields: [shopInventory.shopId],
        references: [shops.id],
    }),
    warehouseInventory: one(warehouseInventory, {
      fields: [shopInventory.warehouseInventoryId],
      references: [warehouseInventory.id],
    }),
}));

export const shopInventorySchema = {
    shopInventory,
    shopInventoryRelations,
};