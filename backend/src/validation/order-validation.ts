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
    paymentMethod: z.enum(['credit_card', 'upi', 'cash_on_delivery', 'razorpay']),
    isProxyItem: z.boolean().default(false),
    shopPrice: z.coerce.number().positive().optional(),
});

export const createWholesaleRazorpayOrderSchema = z.object({
    warehouseInventoryId: z.string().uuid(),
    quantity: z.coerce.number().int().positive(),
});

export const verifyWholesalePaymentSchema = z.object({
    razorpay_order_id: z.string(),
    razorpay_payment_id: z.string(),
    razorpay_signature: z.string(),
    warehouseInventoryId: z.string().uuid(),
    quantity: z.coerce.number().int().positive(),
    shopPrice: z.coerce.number().positive()
}); 