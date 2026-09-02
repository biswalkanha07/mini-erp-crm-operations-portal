const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

// Read categories - available to all authenticated roles
router.get('/search', auth, categoryController.searchAndFilterCategories);
router.get('/', auth, categoryController.getAllCategories);
router.get('/:id', auth, categoryController.getCategoryById);

// Modify categories - restricted to Admin and Warehouse
router.get('/generate-id', auth, requireRole('Admin', 'Warehouse'), categoryController.generateCategoryId);
router.post('/', auth, requireRole('Admin', 'Warehouse'), categoryController.createCategory);
router.put('/:id', auth, requireRole('Admin', 'Warehouse'), categoryController.updateCategoryById);
router.delete('/:id', auth, requireRole('Admin'), categoryController.deleteCategoryById);

module.exports = router;
