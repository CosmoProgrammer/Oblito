import { numeric, pgTable, text, uuid, unique } from 'drizzle-orm/pg-core';
import { warehouses } from './warehouses.js';
import { products } from './products.js';

export const warehouseInventory = pgTable('warehouse_inventory', {
    id: uuid('id').primaryKey().defaultRandom(),
    warehouseId: uuid('warehouse_id').notNull().references(() => warehouses.id, { onDelete: 'cascade' }),
    productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
    stockQuantity: numeric('stock_quantity').notNull().default('0'),
}, (table) => {
    return {
        uniqueWarehouseProduct: unique().on(table.warehouseId, table.productId),
    };
});

export const warehouseInventorySchema = {
    warehouseInventory,
};