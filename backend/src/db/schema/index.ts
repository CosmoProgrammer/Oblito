export * from './users.js';
export * from './addresses.js';
export * from './shops.js';
export * from './warehouses.js';
export * from './categories.js';
export * from './products.js';
export * from './shopInventory.js';
export * from './warehouseInventory.js';
export * from './carts.js';
export * from './cartItems.js';
export * from './orders.js';
export * from './orderItems.js';
export * from './payments.js';
export * from './reviews.js';
export * from './customerQueries.js';
export * from './browsingHistory.js';

import { usersSchema } from './users.js';
import { addressesSchema } from './addresses.js';
import { shopsSchema } from './shops.js';
import { warehousesSchema } from './warehouses.js';
import { categoriesSchema } from './categories.js';
import { productsSchema } from './products.js';
import { shopInventorySchema } from './shopInventory.js';
import { warehouseInventorySchema } from './warehouseInventory.js';
import { cartsSchema } from './carts.js';
import { cartItemsSchema } from './cartItems.js';
import { ordersSchema } from './orders.js';
import { orderItemsSchema } from './orderItems.js';
import { paymentsSchema } from './payments.js';
import { reviewsSchema } from './reviews.js';
import { customerQueriesSchema } from './customerQueries.js';
import { browsingHistorySchema } from './browsingHistory.js';

export const schema = {
    ...usersSchema,
    ...addressesSchema,
    ...shopsSchema,
    ...warehousesSchema,
    ...categoriesSchema,
    ...productsSchema,
    ...shopInventorySchema,
    ...warehouseInventorySchema,
    ...cartsSchema,
    ...cartItemsSchema,
    ...ordersSchema,
    ...orderItemsSchema,
    ...paymentsSchema,
    ...reviewsSchema,
    ...customerQueriesSchema,
    ...browsingHistorySchema,
};

export default schema;
