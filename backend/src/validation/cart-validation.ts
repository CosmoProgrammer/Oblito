import { z } from "zod";

export const addToCartSchema = z.object({
    shopInventoryId: z.uuid(),
    quantity: z.coerce.number().int().positive("Quantity must be at least 1"),
});

export const updateCartItemSchema = z.object({
    quantity: z.coerce.number().int().positive("Quantity must be at least 1"),
});