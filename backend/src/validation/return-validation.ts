import { z } from "zod";

export const requestReturnSchema = z.object({
    orderItemId: z.uuid("Invalid order item ID"),
});

export const updateReturnStatusSchema = z.object({
    status: z.enum(['returned']),
});

export const returnIdParamSchema = z.object({
    returnId: z.uuid("Invalid return ID"),
});