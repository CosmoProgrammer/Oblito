import { pgTable, text, uuid, pgEnum, timestamp } from 'drizzle-orm/pg-core';

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
    profilePictureUrl: text('profile_picture_url'),
});

export const usersSchema = {
    users,
    UserRole,
};
