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
import { productQuerySchema, idParamSchema, uploadQuerySchema, createProductSchema, updateProductSchema } from '../validation/product-validation.js';

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
        console.log('Received get product by ID request with params:', req.params);
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
        res.json({ 
            product: {
                id: req.params.id,
                name: listing.product.name,
                description: listing.product.description,
                categoryId: listing.product.categoryId,
                imageURLs: listing.product.imageURLs,
                price: listing.price,
                stockQuantity: listing.stockQuantity,
                shopId: listing.shopId,
                shopName: listing.shop.name,
                createdAt: listing.product.createdAt,
            }
        });
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
        const { name, description, price, categoryId, stockQuantity, imageUrls } = createProductSchema.parse(req.body);
        /*if (isProxyItem === true && user.role !== 'retailer') {
            return res.status(400).json({
                message: "Invalid input",
                errors: { isProxyItem: ["isProxyItem can only be set to true by retailers"] }
            });
        }*/
        
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
                    isProxyItem: false,
                    warehouseInventoryId: null,
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

export const getAllWholesaleProducts = async (req: any, res: any) => {
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
            conditions.push(gte(warehouseInventory.price, minPrice.toString()));
        }
        if (maxPrice !== undefined) {
            conditions.push(lte(warehouseInventory.price, maxPrice.toString()));
        }

        let orderBy;
        const [sortField, sortOrder] = sort ? sort.split('_') : ['createdAt', 'desc'];
        const orderFunction = sortOrder === 'asc' ? asc : desc;
        if (sortField === 'price') {
            orderBy = orderFunction(warehouseInventory.price);
        } else if (sortField === 'name') {
            orderBy = orderFunction(products.name);
        } else if (sortField === 'createdAt') {
            orderBy = orderFunction(products.createdAt);
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        let queryOne = db.select({
                id: warehouseInventory.id,
                name: products.name,
                description: products.description,
                price: warehouseInventory.price,
                categoryId: products.categoryId,
                imageURLs: products.imageURLs,
                creatorId: products.creatorId,
                createdAt: products.createdAt,
                stockQuantity: warehouseInventory.stockQuantity,
            })
            .from(warehouseInventory)
            .innerJoin(products, eq(warehouseInventory.productId, products.id))
            .where(whereClause)
            .limit(limit)
            .offset(offset);

        if (orderBy) {
            queryOne.orderBy(orderBy);
        }

        let queryTwo = db.select({ count: sql<number>`count(*)` })
                .from(warehouseInventory)
                .innerJoin(products, eq(warehouseInventory.productId, products.id))
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
}

export const getWarehouseProductById = async (req: any, res: any) => {
    try {
        const { id: warehouseInventoryId } = idParamSchema.parse(req.params);
        const listing = await db.query.warehouseInventory.findFirst({
            where: eq(warehouseInventory.id, warehouseInventoryId),
            with: {
                product: true,
                warehouse: {
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

export const patchProductById = async (req: any, res: any) => {
    try {
        const user = req.user;

        const { id: inventoryId } = idParamSchema.parse(req.params); 
        const updates = updateProductSchema.parse(req.body);
        let listing;
        let inventoryTable: typeof shopInventory | typeof warehouseInventory;
        let isOwnerOfGlobalProduct = false;

        if (user.role === 'retailer') {
            inventoryTable = shopInventory;
            console.log("Looking up in shop inventory for retailer");
            listing = await db.select({
                    id: shopInventory.id,
                    productId: shopInventory.productId,
                    creatorId: products.creatorId 
                })
                .from(shopInventory)
                .innerJoin(shops, eq(shopInventory.shopId, shops.id))
                .innerJoin(products, eq(shopInventory.productId, products.id))
                .where(and(
                    eq(shopInventory.id, inventoryId),
                    eq(shops.ownerId, user.id)
                ))
                .limit(1);

        } else { 
            console.log("Looking up in warehouse inventory for non-retailer");
            inventoryTable = warehouseInventory;

            listing = await db.select({
                    id: warehouseInventory.id,
                    productId: warehouseInventory.productId,
                    creatorId: products.creatorId
                })
                .from(warehouseInventory)
                .innerJoin(warehouses, eq(warehouseInventory.warehouseId, warehouses.id))
                .innerJoin(products, eq(warehouseInventory.productId, products.id))
                .where(and(
                    eq(warehouseInventory.id, inventoryId),
                    eq(warehouses.ownerId, user.id) 
                ))
                .limit(1);
        }
        console.log("Found listing:", listing);
        if (listing.length === 0) {
            return res.status(404).json({ message: "Product listing not found or unauthorized" });
        }

        const target = listing[0];
        if(!target){
            return res.status(404).json({ message: "Product listing not found or unauthorized" });
        }
        
        isOwnerOfGlobalProduct = target.creatorId === user.id;


        await db.transaction(async (tx) => {
            const hasGlobalUpdates = updates.name || updates.description || updates.imageUrls || updates.categoryId;
            
            if (hasGlobalUpdates) {
                if (!isOwnerOfGlobalProduct) {
                    throw new Error("Permission denied: You cannot edit global details (name, description) for this product because you did not create it.");
                }

                await tx.update(products)
                    .set({
                        name: updates.name,
                        description: updates.description,
                        categoryId: updates.categoryId,
                        imageURLs: updates.imageUrls
                    })
                    .where(eq(products.id, target.productId));
            }

            const hasInventoryUpdates = updates.price !== undefined || updates.stockQuantity !== undefined;
            
            if (hasInventoryUpdates) {
                const inventoryData: any = {};
                if (updates.price !== undefined) inventoryData.price = updates.price.toString();
                if (updates.stockQuantity !== undefined) inventoryData.stockQuantity = updates.stockQuantity.toString();

                await tx.update(inventoryTable)
                    .set(inventoryData)
                    .where(eq(inventoryTable.id, target.id));
            }
        });

        res.json({ message: "Product updated successfully" });

    } catch (e) {
        if (e instanceof z.ZodError) {
            return res.status(400).json({ errors: e.issues });
        }
        console.error('Error fetching product by ID:', e);
        res.status(500).json({ message: 'Internal server error' });
    }
}