import { Router } from 'express';
import * as authController from './controllers/authController';
import * as productController from './controllers/productController';
import * as saleController from './controllers/saleController';
import * as cashController from './controllers/cashController';
import * as reportController from './controllers/reportController';
import { validate } from './middleware/validationMiddleware';
import { auth } from './middleware/authMiddleware';
import * as authSchema from './schemas/authSchema';
import * as productSchema from './schemas/productSchema';
import * as saleSchema from './schemas/saleSchema';
import * as cashSchema from './schemas/cashSchema';

const router = Router();

// Auth
router.post('/auth/register', validate(authSchema.register), authController.register);
router.post('/auth/login', validate(authSchema.login), authController.login);

// Products (protected)
router.post('/products', auth, validate(productSchema.create), productController.create);
router.get('/products', auth, productController.list);
router.get('/products/:barcode', auth, productController.findByBarcode);

// Sales (protected)
router.post('/sales', auth, validate(saleSchema.create), saleController.create);

// Cash (protected)
router.post('/cash/open', auth, validate(cashSchema.open), cashController.open);
router.post('/cash/close', auth, validate(cashSchema.close), cashController.close);
router.post('/cash/movement', auth, validate(cashSchema.movement), cashController.movement);

// Report (protected)
router.get('/report/daily', auth, reportController.daily);

export default router;