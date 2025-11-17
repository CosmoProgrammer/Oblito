import { z } from "zod";

export const updateProfileSchema = z.object({
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    phone: z.string().min(10).optional(),
    profilePictureUrl: z.url().optional(),
});

export const addressSchema = z.object({
    streetAddress: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    postalCode: z.string().min(1),
    country: z.string().min(1),
    latitude: z.number(),
    longitude: z.number(),
    isPrimary: z.boolean().default(false),
});

export const entitySettingsSchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    addressId: z.uuid().optional(),
});

export const uploadQuerySchema = z.object({
    fileName: z.string().min(1),
    fileType: z.string().min(1), 
});