import { z } from "zod";

export const updateOrderItemStatusSchema = z.object({
    status: z.enum(['processed', 'shipped', 'delivered']),
});

export const updatePaymentStatusSchema = z.object({
    paymentStatus: z.literal('completed'),
});

export const orderItemIdParamSchema = z.object({
    orderItemId: z.uuid("Invalid order item ID"),
});

export const orderIdParamSchema = z.object({
    orderId: z.uuid("Invalid order ID"),
});
