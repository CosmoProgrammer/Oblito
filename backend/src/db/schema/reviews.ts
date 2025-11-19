import { pgTable, text, uuid, timestamp, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users.js';
import { products } from './products.js';
import { shopInventory } from './shopInventory.js';

export const reviews = pgTable('reviews', {
    id: uuid('id').primaryKey().defaultRandom(),
    customerId: uuid('customer_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    productId: uuid('product_id').notNull().references(() => shopInventory.id, { onDelete: 'cascade' }),
    rating: integer('rating').notNull(),
    comment: text('comment'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const reviewsRelations = relations(reviews, ({ one }) => ({
    customer: one(users, {
        fields: [reviews.customerId],
        references: [users.id],
    }),
    product: one(shopInventory, {
        fields: [reviews.productId],
        references: [shopInventory.id],
    }),
}));

export const reviewsSchema = {
    reviews,
    reviewsRelations,
};
