import { z } from 'zod';

export const addressSchema = z.object({
    streetAddress: z.string().min(1, "Street address is required"),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    postalCode: z.string().min(1, "Postal code is required"),
    country: z.string().min(1, "Country is required"),
    isPrimary: z.boolean().default(false),
});

export const updateAddressSchema = addressSchema.partial();