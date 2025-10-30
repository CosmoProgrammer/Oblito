export * from './users.js';
export * from './addresses.js';
export * from './shops.js';
export * from './warehouses.js';
export * from './categories.js';
export * from './products.js';
export * from './shopInventory.js';
export * from './warehouseInventory.js';

import { usersSchema } from './users.js';
import { addressesSchema } from './addresses.js';
import { shopsSchema } from './shops.js';
import { warehousesSchema } from './warehouses.js';
import { categoriesSchema } from './categories.js';
import { productsSchema } from './products.js';
import { shopInventorySchema } from './shopInventory.js';
import { warehouseInventorySchema } from './warehouseInventory.js';

export const schema = {
    ...usersSchema,
    ...addressesSchema,
    ...shopsSchema,
    ...warehousesSchema,
    ...categoriesSchema,
    ...productsSchema,
    ...shopInventorySchema,
    ...warehouseInventorySchema,
};

export default schema;
