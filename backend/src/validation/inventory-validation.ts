import { z } from "zod";
import { warehouseInventory } from "../db/schema/warehouseInventory.js";

export const createListingSchema = z.object({
    warehouseInventoryId: z.uuid("Invalid warehouse inventory ID"),
    price: z.coerce.number().min(0, "Price must be 0 or more"),
    isProxyItem: z.boolean().optional().default(false),
    stockQuantity: z.coerce.number().int().min(0, "Stock must be 0 or more").default(0),
});