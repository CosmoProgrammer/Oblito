import db from '../db/index.js';
import { reviews, users } from '../db/schema/index.js';
import { and, eq } from 'drizzle-orm';
import { createReviewSchema, getReviewsSchema, deleteReviewSchema } from '../validation/review-validation.js';
import { z } from 'zod';

export const getReviewsByProduct = async (req: any, res: any) => {
    try {
        const { productId } = getReviewsSchema.parse(req).params;

        const productReviews = await db.select({
            id: reviews.id,
            rating: reviews.rating,
            comment: reviews.comment,
            createdAt: reviews.createdAt,
            customer: {
                id: users.id,
                firstName: users.firstName,
                lastName: users.lastName,
                profilePictureUrl: users.profilePictureUrl,
            }
        })
        .from(reviews)
        .where(eq(reviews.productId, productId))
        .leftJoin(users, eq(reviews.customerId, users.id));

        res.status(200).json(productReviews);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ errors: error.issues });
        }
        console.error(error);
        res.status(500).json({ message: 'Error getting reviews' });
    }
};

export const createReview = async (req: any, res: any) => {
    try {
        const { body, params } = createReviewSchema.parse(req);
        const user = req.user as { 
            id: string, 
            email: string, 
            profilePictureUrl: string | null, 
            firstName: string, 
            lastName: string, 
            role: 'customer' | 'retailer' | 'wholesaler' 
        };

        const newReview = await db.insert(reviews).values({
            productId: params.productId,
            customerId: user.id,
            rating: body.rating,
            comment: body.comment,
        }).returning();

        res.status(201).json(newReview[0]);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ errors: error.issues });
        }
        console.error(error);
        res.status(500).json({ message: 'Error creating review' });
    }
};

export const deleteReview = async (req: any, res: any) => {
    try {
        const { reviewId } = deleteReviewSchema.parse(req).params;
        const user = req.user as { 
            id: string, 
            email: string, 
            profilePictureUrl: string | null, 
            firstName: string, 
            lastName: string, 
            role: 'customer' | 'retailer' | 'wholesaler' 
        };

        const review = await db.select().from(reviews).where(eq(reviews.id, reviewId));

        if (review.length === 0 || !review[0]) {
            return res.status(404).json({ message: 'Review not found' });
        }

        if (review[0].customerId !== user.id) {
            return res.status(403).json({ message: 'You are not authorized to delete this review' });
        }

        await db.delete(reviews).where(and(eq(reviews.id, reviewId), eq(reviews.customerId, user.id)));

        res.status(200).json({ message: 'Review deleted successfully' });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ errors: error.issues });
        }
        console.error(error);
        res.status(500).json({ message: 'Error deleting review' });
    }
}

