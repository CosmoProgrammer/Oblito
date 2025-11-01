import { pgTable, text, uuid, timestamp, boolean, point } from 'drizzle-orm/pg-core';
import { users } from './users.js';

export const addresses = pgTable('addresses', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    streetAddress: text('street_address').notNull(),
    city: text('city').notNull(),
    state: text('state').notNull(),
    postalCode: text('postal_code').notNull(),
    country: text('country').notNull(),
    location: point('location').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    isPrimary: boolean('is_primary').default(false),
});

export const addressesSchema = {
    addresses,
};
