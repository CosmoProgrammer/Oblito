import { pgTable, text, uuid, timestamp, numeric } from "drizzle-orm/pg-core";
import { categories } from "./categories.js";
import { users } from "./users.js"

export const products = pgTable("products", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    description: text("description"),
    price: numeric('price').notNull(),
    categoryId: uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
    imageURLs: text("image_urls").array().default([]),
    creatorId: uuid("creator_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const productsSchema = {
    products,
};