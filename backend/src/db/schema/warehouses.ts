import { pgTable, text, uuid, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users.js';
import { addresses } from './addresses.js';

export const warehouses = pgTable('warehouses', {
    id: uuid('id').primaryKey().defaultRandom(),
    ownerId: uuid('owner_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    addressId: uuid('address_id').notNull().references(() => addresses.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const warehousesSchema = {
    warehouses,
};
