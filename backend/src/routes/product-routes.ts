import { Router } from 'express';

import { protect, optionalAuth } from "../middleware/auth-middleware.js";
import { checkRole } from '../middleware/role-middleware.js';

import { handleGetUploadUrl, getAllProducts, getProductById, createProduct, getAllWholesaleProducts, getWarehouseProductById, patchProductById, getQuickSearchResults, getQuickWholesaleSearchResults, getRecommendedProducts } from '../controllers/product-controller.js';

const router = Router();

router.get('/products/upload-url', protect, checkRole(['wholesaler', 'retailer']), handleGetUploadUrl);

router.get('/products', getAllProducts);

router.get('/recommendations', protect, getRecommendedProducts);

router.get('/products/:id', optionalAuth, getProductById);

router.post('/products', protect, checkRole(['wholesaler', 'retailer']), createProduct);

router.get('/warehouse-products', protect, checkRole(['retailer']), getAllWholesaleProducts);

router.get('/warehouse-products/quick-search/:q', protect, checkRole(['retailer']), getQuickWholesaleSearchResults);

router.get('/warehouse-products/:id', protect, checkRole(['retailer']), getWarehouseProductById);

router.get('/products/quick-search/:q', getQuickSearchResults);

router.patch('/products/:id', protect, checkRole(['wholesaler', 'retailer']), patchProductById);

export default router;