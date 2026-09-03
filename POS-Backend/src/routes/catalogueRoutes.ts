/**
 * Catalogue Routes
 * Phase 4 - Mini ERP + CRM Operations Portal
 */

import { Router } from 'express';
import * as catalogueController from '../controllers/catalogueController';
import upload from '../middleware/upload';
import auth from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();

// Read products / catalogues - available to all authenticated roles
router.get('/search', auth, catalogueController.searchAndFilterCatalogues);
router.get('/', auth, catalogueController.getAllCatalogues);
router.get('/:id', auth, catalogueController.getCatalogueById);

// Create / Update products - restricted to Admin and Warehouse
router.post('/', auth, requireRole('Admin', 'Warehouse'), upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 },
  { name: 'images', maxCount: 10 }
]), catalogueController.createCatalogue);

router.put('/:id', auth, requireRole('Admin', 'Warehouse'), upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 },
  { name: 'images', maxCount: 10 }
]), catalogueController.updateCatalogueById);

// Delete products - restricted to Admin
router.delete('/:id', auth, requireRole('Admin'), catalogueController.deleteCatalogueById);

export default router;
