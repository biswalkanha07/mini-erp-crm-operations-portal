/**
 * Product Routes
 * Phase 4 - Mini ERP + CRM Operations Portal
 */

import { Router } from 'express';
import * as productController from '../controllers/productController';
import auth from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();

// Read products
router.get('/', auth, productController.getAllProducts);
router.get('/:id', auth, productController.getProductById);

// Modify products
router.post('/', auth, requireRole('Admin', 'Warehouse'), productController.createProduct);
router.put('/:id', auth, requireRole('Admin', 'Warehouse'), productController.updateProduct);
router.delete('/:id', auth, requireRole('Admin'), productController.deleteProduct);

export default router;
