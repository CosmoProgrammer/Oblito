import { pgTable, text, uuid, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users.js';
import { products } from './products.js';
import { shopInventory } from './shopInventory.js';

export const queryStatusEnum = pgEnum('query_status', ['open', 'answered', 'closed']);

export const customerQueries = pgTable('customer_queries', {
    id: uuid('id').primaryKey().defaultRandom(),
    customerId: uuid('customer_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    productId: uuid('product_id').notNull().references(() => shopInventory.id, { onDelete: 'cascade' }),
    query: text('query').notNull(),
    response: text('response'),
    status: queryStatusEnum('status').notNull().default('open'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const customerQueriesRelations = relations(customerQueries, ({ one }) => ({
    customer: one(users, {
        fields: [customerQueries.customerId],
        references: [users.id],
    }),
    product: one(shopInventory, {
        fields: [customerQueries.productId],
        references: [shopInventory.id],
    }),
}));

export const customerQueriesSchema = {
    customerQueries,
    queryStatusEnum,
    customerQueriesRelations,
};
