const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

// Read products
router.get('/', auth, productController.getAllProducts);
router.get('/:id', auth, productController.getProductById);

// Modify products
router.post('/', auth, requireRole('Admin', 'Warehouse'), productController.createProduct);
router.put('/:id', auth, requireRole('Admin', 'Warehouse'), productController.updateProduct);
router.delete('/:id', auth, requireRole('Admin'), productController.deleteProduct);

module.exports = router;
