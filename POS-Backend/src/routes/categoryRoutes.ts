/**
 * Category Routes
 * Phase 4 - Mini ERP + CRM Operations Portal
 */

import { Router } from 'express';
import * as categoryController from '../controllers/categoryController';
import auth from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();

// Read categories - available to all authenticated roles
router.get('/search', auth, categoryController.searchAndFilterCategories);
router.get('/', auth, categoryController.getAllCategories);
router.get('/:id', auth, categoryController.getCategoryById);

// Modify categories - restricted to Admin and Warehouse
router.get('/generate-id', auth, requireRole('Admin', 'Warehouse'), categoryController.generateCategoryId);
router.post('/', auth, requireRole('Admin', 'Warehouse'), categoryController.createCategory);
router.put('/:id', auth, requireRole('Admin', 'Warehouse'), categoryController.updateCategoryById);
router.delete('/:id', auth, requireRole('Admin'), categoryController.deleteCategoryById);

export default router;
