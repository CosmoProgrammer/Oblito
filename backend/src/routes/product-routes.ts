import { Router } from 'express';
import { z } from 'zod';
 
import db from '../db/index.js';
import { eq, lte, gte, asc, desc, and, inArray, sql } from "drizzle-orm";
import { users } from '../db/schema/users.js';
import { products } from '../db/schema/products.js';
import { categories } from '../db/schema/categories.js';

import { protect } from "../middleware/auth-middleware.js";

const router = Router();

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
            conditions.push(gte(products.price, minPrice.toString()));
        }
        if (maxPrice !== undefined) {
            conditions.push(lte(products.price, maxPrice.toString()));
        }

        let orderBy;
        const [sortField, sortOrder] = sort ? sort.split('_') : ['createdAt', 'desc'];
        const orderFunction = sortOrder === 'asc' ? asc : desc;
        if (sortField === 'price') {
            orderBy = orderFunction(products.price);
        } else if (sortField === 'name') {
            orderBy = orderFunction(products.name);
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        let queryOne = db.select()
                .from(products)
                .where(whereClause)
                .limit(limit)
                .offset(offset);
        if (orderBy) {
            queryOne.orderBy(orderBy);
        }

        let queryTwo = db.select({ count: sql<number>`count(*)` })
                .from(products)
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
        const { id: productId } = idParamSchema.parse(req.params);
        const product = await db.query.products.findFirst({
            where: eq(products.id, productId),
        });

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json({ product });
    } catch (e) {
        console.error('Error fetching product by ID:', e);
        res.status(500).json({ message: 'Internal server error' });
    }
});

export default router;