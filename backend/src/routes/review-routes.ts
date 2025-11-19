import { Router } from 'express';
import { getReviewsByProduct, createReview, deleteReview } from '../controllers/review-controller.js';
import { protect } from '../middleware/auth-middleware.js';
import { checkRole } from '../middleware/role-middleware.js';

const router = Router();

router.get('/reviews/product/:productId', getReviewsByProduct);

router.post('/reviews/product/:productId', protect, checkRole(['customer']), createReview);

router.delete('/reviews/:reviewId', protect, checkRole(['customer']), deleteReview);

export default router;
