import { z } from 'zod';

export const createReviewSchema = z.object({
    body: z.object({
      rating: z.number().int().min(1).max(5),
      comment: z.string().optional(),
    }),
    params: z.object({
      productId: z.uuid("Invalid product ID"),
    }),
});

export const getReviewsSchema = z.object({
    params: z.object({
      productId: z.uuid("Invalid product ID"),
    }),
});

export const deleteReviewSchema = z.object({
    params: z.object({
        reviewId: z.uuid("Invalid review ID"),
    }),
});
