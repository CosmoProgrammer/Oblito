import { pgTable, text, uuid, pgEnum, timestamp, boolean, point } from 'drizzle-orm/pg-core';

export const UserRole = pgEnum('user_role', ['customer', 'retailer', 'wholesaler']);

export const users = pgTable('users', {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').unique().notNull(),
    phone: text('phone').unique(),
    passwordHash: text('password_hash'),
    firstName: text('first_name'),
    lastName: text('last_name'),
    role: UserRole('role').notNull(),
    googleId: text('google_id').unique(),
    facebookId: text('facebook_id').unique(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

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

export const shops = pgTable('shops', {
    id: uuid('id').primaryKey().defaultRandom(),
    ownerId: uuid('owner_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    addressId: uuid('address_id').notNull().references(() => addresses.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const warehouses = pgTable('warehouses', {
    id: uuid('id').primaryKey().defaultRandom(),
    ownerId: uuid('owner_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    addressId: uuid('address_id').notNull().references(() => addresses.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});