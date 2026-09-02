const express = require('express');
const router = express.Router();
const stockMovementController = require('../controllers/stockMovementController');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

// Read stock movements - accessible to all authenticated ERP roles (Admin, Warehouse, Sales, Accounts, legacy POS)
router.get('/', auth, stockMovementController.getAllStockMovements);
router.get('/:id', auth, stockMovementController.getStockMovementById);

// Create stock movement - strictly restricted to Admin and Warehouse
router.post('/', auth, requireRole('Admin', 'Warehouse'), stockMovementController.createStockMovement);

module.exports = router;
