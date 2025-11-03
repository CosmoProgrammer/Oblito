import { pgTable, text, uuid, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users.js';
import { addresses } from './addresses.js';

export const warehouses = pgTable('warehouses', {
    id: uuid('id').primaryKey().defaultRandom(),
    ownerId: uuid('owner_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    name: text('name'),
    addressId: uuid('address_id').references(() => addresses.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const warehousesSchema = {
    warehouses,
};
