import { pgTable, text, uuid, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users.js';
import { addresses } from './addresses.js';

export const shops = pgTable('shops', {
    id: uuid('id').primaryKey().defaultRandom(),
    ownerId: uuid('owner_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    addressId: uuid('address_id').notNull().references(() => addresses.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const shopsSchema = {
    shops,
};
