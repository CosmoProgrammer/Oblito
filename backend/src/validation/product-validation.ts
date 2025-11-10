import { z } from "zod";

export const productQuerySchema = z.object({
        page: z.preprocess((val)=>Number(val || 1), z.number().int().min(1)),
        limit: z.preprocess((val)=>Number(val || 10), z.number().int().min(1).max(100)),
        minPrice: z.preprocess((val)=> val ? Number(val) : undefined, z.number().min(0).optional()),
        maxPrice: z.preprocess((val)=> val ? Number(val) : undefined, z.number().min(0).optional()),
        sort: z.string().regex(/^(price|name|createdAt)_(asc|desc)$/).optional().default('createdAt_desc'),
        categories: z.preprocess((val)=>(val as string)?.split(',') || [], z.array(z.string()).default([]))
    }).refine((data) => {
        if (data.minPrice !== undefined && data.maxPrice !== undefined) {
            return data.maxPrice >= data.minPrice;
        }
        return true;
    },{
        message: "maxPrice must be greater than or equal to minPrice",
        path: ["maxPrice"],
});

export const idParamSchema = z.object({
    id: z.uuid({
        message: "Invalid product ID format (must be a UUID)",
    })
});

export const uploadQuerySchema = z.object({
    fileName: z.string().min(1),
    fileType: z.string().min(1), // 'image/jpeg'
});

export const createProductSchema = z.object({
    name: z.string().min(3, "Name must be at least 3 characters"),
    description: z.string().optional(),
    price: z.coerce.number().positive("Price must be a positive number"),
    categoryId: z.string().optional(),
    stockQuantity: z.coerce.number().int().min(0, "Stock must be 0 or more"),
    imageUrls: z.array(z.url("Must be a valid URL")).default([]),
    //isProxyItem: z.boolean().optional().default(false)
});