import { z } from "zod";

export const updateProfileSchema = z.object({
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    phone: z.string().min(10).optional(),
    profilePictureUrl: z.url().optional(),
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