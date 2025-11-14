import { z } from 'zod';

import db from '../db/index.js';
import { shops } from '../db/schema/shops.js';
import { warehouseInventory } from '../db/schema/warehouseInventory.js';
import { shopInventory } from '../db/schema/shopInventory.js';
import { products } from '../db/schema/products.js';
import { categories } from '../db/schema/categories.js';
import { eq, lte, gte, asc, desc, and, inArray, sql, ne } from 'drizzle-orm';

import { createListingSchema } from '../validation/inventory-validation.js';
import { productQuerySchema } from '../validation/product-validation.js';
import { warehouses } from '../db/schema.js';

export const handleGetInventory = async (req: any, res: any) => {
    try {
        const user = req.user as { 
            id: string, 
            email: string, 
            profilePictureUrl: string | null, 
            firstName: string, 
            lastName: string, 
            role: 'customer' | 'retailer' | 'wholesaler' 
        }; 

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
        let orderBy;
        let queryOne; 
        let queryTwo;

        if (user.role === 'retailer') {
            const shop = await db.query.shops.findFirst({
                where: eq(shops.ownerId, user.id),
            });
            if (!shop) {throw new Error('Retailer shop not found')};

            conditions.push(eq(shopInventory.shopId, shop.id));

            if (minPrice !== undefined) {
                conditions.push(gte(shopInventory.price, minPrice.toString()));
            }
            if (maxPrice !== undefined) {
                conditions.push(lte(shopInventory.price, maxPrice.toString()));
            }

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

            queryOne = db.select({
                    id: shopInventory.id,
                    price: shopInventory.price,
                    stockQuantity: shopInventory.stockQuantity,
                    isProxyItem: shopInventory.isProxyItem,
                    productId: products.id,
                    name: products.name,
                    imageUrls: products.imageURLs,
                    warehouseStock: warehouseInventory.stockQuantity,
                    wholesalerId: warehouses.ownerId,
                })
                .from(shopInventory)
                .innerJoin(products, eq(shopInventory.productId, products.id))
                .leftJoin(warehouseInventory, eq(shopInventory.warehouseInventoryId, warehouseInventory.id))
                .leftJoin(warehouses, eq(warehouseInventory.warehouseId, warehouses.id))
                .where(whereClause)
                .limit(limit)
                .offset(offset)
            if(orderBy) {
                queryOne.orderBy(orderBy);
            }

            queryTwo = db.select({ count: sql<number>`count(*)` })
                        .from(shopInventory)
                        .innerJoin(products, eq(shopInventory.productId, products.id))
                        .where(whereClause);
        } else if (user.role === 'wholesaler') {
            const warehouse = await db.query.warehouses.findFirst({
                where: eq(warehouses.ownerId, user.id),
            });
            if (!warehouse) {throw new Error('Wholesaler warehouse not found')};

            conditions.push(eq(warehouseInventory.warehouseId, warehouse.id));

            if (minPrice !== undefined) {
                conditions.push(gte(warehouseInventory.price, minPrice.toString()));
            }
            if (maxPrice !== undefined) {
                conditions.push(lte(warehouseInventory.price, maxPrice.toString()));
            }

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

            queryOne = db.select({
                    id: warehouseInventory.id,
                    price: warehouseInventory.price,
                    stock: warehouseInventory.stockQuantity,
                    productId: products.id,
                    name: products.name,
                    imageUrls: products.imageURLs,
                })
                .from(warehouseInventory)
                .innerJoin(products, eq(warehouseInventory.productId, products.id))
                .where(whereClause)
                .limit(limit)
                .offset(offset);

            if(orderBy) {
                queryOne.orderBy(orderBy);
            }

            queryTwo = db.select({ count: sql<number>`count(*)` })
                        .from(warehouseInventory)
                        .innerJoin(products, eq(warehouseInventory.productId, products.id))
                        .where(whereClause);
        }

        const [productsList, totalCount] = await Promise.all([
            queryOne,
            queryTwo
        ]);

        const totalItems = totalCount ? (totalCount[0]?.count || 0) : 0;
        const totalPages = Math.ceil(totalItems / limit);

        res.json({
            products: productsList,
            pagination: {
                totalCount: totalItems,
                totalPages,
                currentPage: page,
                limit
            }
        });
    } catch (e) {
        if (e instanceof z.ZodError) {
            return res.status(400).json({ errors: e.issues });
        }
        console.error('Error fetching inventory:', e);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const handleCreateRetailListing = async (req: any, res: any) => {
    try {
        const user = req.user as { 
            id: string, 
            email: string, 
            profilePictureUrl: string | null, 
            firstName: string, 
            lastName: string, 
            role: 'customer' | 'retailer' | 'wholesaler' 
        }; 

        const { warehouseInventoryId, price, isProxyItem, stockQuantity } = createListingSchema.parse(req.body);

        const newListing= await db.transaction(async (tx) => {
            const shop = await tx.query.shops.findFirst({
                where: eq(shops.ownerId, user.id),
            });
            if (!shop) { throw new Error('Retailer shop not found')};

            const sourceItem = await tx.query.warehouseInventory.findFirst({
                where: eq(warehouseInventory.id, warehouseInventoryId)
            });
            if (!sourceItem) { throw new Error('Source warehouse inventory item not found')};

            const sourceStock = parseInt(sourceItem.stockQuantity);
            if (sourceStock < stockQuantity) {
                throw new Error('Insufficient stock in warehouse inventory');
            }

            await tx.update(warehouseInventory).set({
                stockQuantity: (sourceStock - stockQuantity).toString()
            }).where(eq(warehouseInventory.id, warehouseInventoryId));

            const newShopListing = await tx.insert(shopInventory).values({
                shopId: shop.id,
                productId: sourceItem.productId,
                stockQuantity: stockQuantity.toString(),
                price: price.toString(),
                isProxyItem: isProxyItem,
                warehouseInventoryId: warehouseInventoryId,
            }).returning();

            return newShopListing[0];
        });

        res.status(201).json(newListing);
    } catch (e) {
        console.log('Error creating product:', e);
        if (e instanceof z.ZodError) {
            return res.status(400).json({ errors: e.issues });
        }
        console.error('Error fetching product by ID:', e);
        
        res.status(500).json({ message: e })
    }
};