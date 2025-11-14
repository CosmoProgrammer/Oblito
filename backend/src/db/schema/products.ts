import { relations } from "drizzle-orm";
import { pgTable, text, uuid, timestamp, numeric } from "drizzle-orm/pg-core";
import { categories } from "./categories.js";
import { users } from "./users.js"
import { shopInventory } from "./shopInventory.js";
import { warehouseInventory } from "./warehouseInventory.js";

export const products = pgTable("products", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    description: text("description"),
    categoryId: uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
    imageURLs: text("image_urls").array().default([]),
    creatorId: uuid("creator_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const productsRelations = relations(products, ({ many }) => ({
    shopInventories: many(shopInventory),
    warehouseInventories: many(warehouseInventory),
}));

export const productsSchema = {
    products,
    productsRelations,
};