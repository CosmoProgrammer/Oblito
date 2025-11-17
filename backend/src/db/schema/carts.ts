import { pgTable, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users.js';
import { cartItems } from './cartItems.js';

export const carts = pgTable('carts', {
    id: uuid('id').primaryKey().defaultRandom(),
    customerId: uuid('customer_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
});

export const cartsRelations = relations(carts, ({ many }) => ({
    cartItems: many(cartItems),
}));

export const cartsSchema = {
    carts,
    cartsRelations,
};
