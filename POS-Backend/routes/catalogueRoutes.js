const express = require('express');
const router = express.Router();
const catalogueController = require('../controllers/catalogueController');
const upload = require('../middleware/upload');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

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

module.exports = router;
