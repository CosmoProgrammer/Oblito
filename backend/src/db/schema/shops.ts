import { relations } from 'drizzle-orm';
import { pgTable, text, uuid, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './users.js';
import { addresses } from './addresses.js';
import { shopInventory } from './shopInventory.js';

export const shops = pgTable('shops', {
    id: uuid('id').primaryKey().defaultRandom(),
    ownerId: uuid('owner_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    name: text('name'),
    description: text('description'),
    addressId: uuid('address_id').references(() => addresses.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => {
    return {
        shopNameTrgmIndex: index("shops_name_trgm_index").using("gin", table.name.op("gin_trgm_ops")),
    }
});

export const shopsRelations = relations(shops, ({ many }) => ({
    shopInventories: many(shopInventory),
}));

export const shopsSchema = {
    shops,
    shopsRelations,
};
