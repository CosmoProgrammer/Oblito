import { pgTable, text, uuid } from 'drizzle-orm/pg-core';

export const categories = pgTable('categories', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    description: text('description'),
    parentId: uuid('parent_id').references((): any => categories.id, { onDelete: 'set null' }),
    imageURL: text('image_url'),
});

export const categoriesSchema = {
    categories,
};
