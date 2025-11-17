import { z } from "zod";

export const createOrderSchema = z.object({
    deliveryAddressId: z.uuid("Invalid delivery address ID"),
    paymentMethod: z.enum(['credit_card', 'upi', 'cash_on_delivery'], "Invalid payment method"),
});

export const orderIdParamSchema = z.object({
    orderId: z.uuid("Invalid order ID"),
});

export const createWholesaleOrderSchema = z.object({    
    warehouseInventoryId: z.string().uuid(),
    quantity: z.coerce.number().int().positive(),
    paymentMethod: z.enum(['credit_card', 'upi', 'cash_on_delivery']),
    isProxyItem: z.boolean().default(false),
}); 