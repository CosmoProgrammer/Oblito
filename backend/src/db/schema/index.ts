import { usersSchema } from './users.js';
import { addressesSchema } from './addresses.js';
import { shopsSchema } from './shops.js';
import { warehousesSchema } from './warehouses.js';

export const schema = {
    ...usersSchema,
    ...addressesSchema,
    ...shopsSchema,
    ...warehousesSchema,
};

export default schema;
