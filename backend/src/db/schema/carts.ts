import { pgTable, uuid } from 'drizzle-orm/pg-core';
import { users } from './users.js';

export const carts = pgTable('carts', {
    id: uuid('id').primaryKey().defaultRandom(),
    customerId: uuid('customer_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
});

export const cartsSchema = {
    carts,
};
