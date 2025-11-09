import { Router } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
 
import db from '../db/index.js';
import { eq, lte, gte, asc, desc, and, inArray, sql, ne } from "drizzle-orm";
import { users } from '../db/schema/users.js';
import { products } from '../db/schema/products.js';
import { categories } from '../db/schema/categories.js';
import { warehouses } from '../db/schema/warehouses.js';
import { shops } from '../db/schema.js';
import { shopInventory } from '../db/schema/shopInventory.js';
import { warehouseInventory } from '../db/schema/warehouseInventory.js';

import { protect } from "../middleware/auth-middleware.js";
import { checkRole } from '../middleware/role-middleware.js';

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { id } from 'zod/locales';


const router = Router();

const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'eu-north-1',
    credentials: {
        accessKeyId: process.env.ACCESS_KEY || '',
        secretAccessKey: process.env.SECRET_KEY || '',
    }
});
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || 'oblito';

const productQuerySchema = z.object({
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

const idParamSchema = z.object({
    id: z.uuid({
        message: "Invalid product ID format (must be a UUID)",
    })
});

const uploadQuerySchema = z.object({
    fileName: z.string().min(1),
    fileType: z.string().min(1), // 'image/jpeg'
});

const createProductSchema = z.object({
    name: z.string().min(3, "Name must be at least 3 characters"),
    description: z.string().optional(),
    price: z.coerce.number().positive("Price must be a positive number"),
    categoryId: z.string().optional(),
    stockQuantity: z.coerce.number().int().min(0, "Stock must be 0 or more"),
    imageUrls: z.array(z.url("Must be a valid URL")).default([]),
    isProxyItem: z.boolean().optional().default(false)
});

router.get('/products/upload-url', protect, checkRole(['wholesaler', 'retailer']), async (req, res) => {
    try {
        console.log('Received upload URL request with query:', req.query);
        const { fileName, fileType } = uploadQuerySchema.parse(req.query);
        const randomName = crypto.randomBytes(16).toString('hex');
        const key = `products/${randomName}-${fileName}`;
        const command = new PutObjectCommand({
            Bucket: S3_BUCKET_NAME,
            Key: key,
            ContentType: fileType,
        });

        const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
        const finalUrl = `https://${S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
        console.log('Generated final url:', finalUrl);
        console.log('Signed URL:', signedUrl);
        res.json({ uploadUrl: signedUrl, finalUrl });
    } catch (e) {
        console.log('Error generating upload URL:', e);
        if (e instanceof z.ZodError) {
            return res.status(400).json({ errors: e.issues });
        }
        console.error('Error fetching product by ID:', e);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/products',  async (req, res) => {
    try{
        const {page, limit, sort, minPrice, maxPrice, categories: categoriesReq} = productQuerySchema.parse(req.query);
        const offset = (page - 1) * limit;

        const categoryIds = [];
        for (let category of categoriesReq) {
            const dbCategory = await db.query.categories.findFirst({
                where: eq(categories.name, category)
            });
            if (dbCategory) {
                categoryIds.push(dbCategory.id);
            }
        }

        const conditions = []
        if (categoryIds.length > 0) {
            conditions.push(inArray(products.categoryId, categoryIds));
        }


        if (minPrice !== undefined) {
            conditions.push(gte(shopInventory.price, minPrice.toString()));
        }
        if (maxPrice !== undefined) {
            conditions.push(lte(shopInventory.price, maxPrice.toString()));
        }

        let orderBy;
        const [sortField, sortOrder] = sort ? sort.split('_') : ['createdAt', 'desc'];
        const orderFunction = sortOrder === 'asc' ? asc : desc;
        if (sortField === 'price') {
            orderBy = orderFunction(shopInventory.price);
        } else if (sortField === 'name') {
            orderBy = orderFunction(products.name);
        } else if (sortField === 'createdAt') {
            orderBy = orderFunction(products.createdAt);
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        let queryOne = db.select({
                id: shopInventory.id,
                name: products.name,
                description: products.description,
                price: shopInventory.price,
                categoryId: products.categoryId,
                imageURLs: products.imageURLs,
                creatorId: products.creatorId,
                createdAt: products.createdAt,
                stockQuantity: shopInventory.stockQuantity,
            })
            .from(shopInventory)
            .innerJoin(products, eq(shopInventory.productId, products.id))
            .where(whereClause)
            .limit(limit)
            .offset(offset);

        if (orderBy) {
            queryOne.orderBy(orderBy);
        }

        let queryTwo = db.select({ count: sql<number>`count(*)` })
                .from(shopInventory)
                .innerJoin(products, eq(shopInventory.productId, products.id))
                .where(whereClause);


        const [productsList, totalCount] = await Promise.all([
            queryOne,
            queryTwo
        ]);

        const totalPages = Math.ceil((totalCount[0]?.count || 0) / limit);
        

        res.json({
            products: productsList,
            pagination: {
                totalCount: totalCount[0]?.count || 0,
                totalPages,
                currentPage: page,
                limit
            }
        });
    } catch (e) {
        if (e instanceof z.ZodError) {
            return res.status(400).json({ errors: e.issues });
        }
        console.error('Error fetching products:', e);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/products/:id', async (req, res) => {
    try {
        const { id: shopInventoryId } = idParamSchema.parse(req.params);
        const listing = await db.query.shopInventory.findFirst({
            where: eq(shopInventory.id, shopInventoryId),
            with: {
                product: true,
                shop: {
                    columns: {
                        id: true,
                        name: true,
                    }
                }
            }
        });

        if (!listing) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json({ product: listing });
    } catch (e) {
        if (e instanceof z.ZodError) {
            return res.status(400).json({ errors: e.issues });
        }
        console.error('Error fetching product by ID:', e);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.post('/products', protect, checkRole(['wholesaler', 'retailer']), async (req, res) => {
    try {
        console.log('Received create product request with body:', req.body);
        const user = req.user as { 
            id: string, 
            email: string, 
            profilePictureUrl: string | null, 
            firstName: string, 
            lastName: string, 
            role: 'customer' | 'retailer' | 'wholesaler' 
        };
        const { name, description, price, categoryId, stockQuantity, imageUrls, isProxyItem } = createProductSchema.parse(req.body);
        if (isProxyItem === true && user.role !== 'retailer') {
            return res.status(400).json({
                message: "Invalid input",
                errors: { isProxyItem: ["isProxyItem can only be set to true by retailers"] }
            });
        }
        
        const newProduct = await db.transaction(async (tx) => {
            const productInsert = await tx.insert(products).values({
                name,
                description,
                categoryId,
                imageURLs: imageUrls,
                creatorId: user.id,
            }).returning();

            const createdProduct = productInsert[0];
            if (!createdProduct) {
                throw new Error('Failed to create product');
            }

            if(user.role === 'retailer'){
                const shop = await tx.query.shops.findFirst({
                    where: eq(shops.ownerId, user.id)
                });
                if(!shop){
                    throw new Error('Retailer shop not found');
                }

                await tx.insert(shopInventory).values({
                    shopId: shop.id,
                    productId: createdProduct.id,
                    stockQuantity: stockQuantity.toString(),
                    price: price.toString(),
                    isProxyItem: isProxyItem
                });
            } else if (user.role === 'wholesaler'){
                const warehouse = await tx.query.warehouses.findFirst({
                    where: eq(warehouses.ownerId, user.id)
                });
                if(!warehouse){
                    throw new Error('Wholesaler warehouse not found');
                }

                await tx.insert(warehouseInventory).values({
                    warehouseId: warehouse.id,
                    productId: createdProduct.id,
                    stockQuantity: stockQuantity.toString(),
                    price: price.toString(),
                });
            }
            return createdProduct;
        });

        res.status(201).json(newProduct);
    } catch (e) {
        console.log('Error creating product:', e);
        if (e instanceof z.ZodError) {
            return res.status(400).json({ errors: e.issues });
        }
        console.error('Error fetching product by ID:', e);
        
        res.status(500).json({ message: e });
    }
}); 

export default router;