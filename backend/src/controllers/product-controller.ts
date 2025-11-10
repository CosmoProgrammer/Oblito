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

import { getS3UploadUrl } from '../services/s3-service.js';
import { productQuerySchema, idParamSchema, uploadQuerySchema, createProductSchema } from '../validation/product-validation.js';

export const handleGetUploadUrl = async (req: any, res: any) => {
    try {
        console.log('Received upload URL request with query:', req.query);
        const { fileName, fileType } = uploadQuerySchema.parse(req.query);
        const { uploadUrl, finalUrl } = await getS3UploadUrl(fileName, fileType);
        console.log('Generated final url:', finalUrl);
        console.log('Signed URL:', uploadUrl);
        res.json({ uploadUrl, finalUrl });
    } catch (e) {
        console.log('Error generating upload URL:', e);
        if (e instanceof z.ZodError) {
            return res.status(400).json({ errors: e.issues });
        }
        console.error('Error fetching product by ID:', e);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getAllProducts = async (req: any, res: any) => {
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
};

export const getProductById = async (req: any, res: any) => {
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
};

export const createProduct = async (req: any, res: any) => {
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
};