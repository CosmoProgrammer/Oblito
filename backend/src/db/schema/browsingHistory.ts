import { pgTable, uuid, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users.js';
import { products } from './products.js';
import { shopInventory } from './shopInventory.js';

export const browsingHistory = pgTable('browsing_history', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    productId: uuid('product_id').notNull().references(() => shopInventory.id, { onDelete: 'cascade' }),
    viewedAt: timestamp('viewed_at', { withTimezone: true }).defaultNow(),
});

export const browsingHistoryRelations = relations(browsingHistory, ({ one }) => ({
    user: one(users, {
        fields: [browsingHistory.userId],
        references: [users.id],
    }),
    product: one(shopInventory, {
        fields: [browsingHistory.productId],
        references: [shopInventory.id],
    }),
}));

export const browsingHistorySchema = {
    browsingHistory,
    browsingHistoryRelations,
};
