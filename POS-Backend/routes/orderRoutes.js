const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

// Store creates order
router.post('/', auth, requireRole('Admin', 'Sales', 'manager', 'cashier'), orderController.createOrder);

// Store gets own orders
router.get('/my', auth, requireRole('Admin', 'Sales', 'manager', 'cashier'), orderController.getStoreOrders);

// Admin & operational roles get all orders
router.get('/', auth, requireRole('Admin', 'Sales', 'Warehouse', 'Accounts'), orderController.getAllOrders);

// Admin & Warehouse update order status
router.patch('/:id', auth, requireRole('Admin', 'Warehouse'), orderController.updateOrderStatus);

module.exports = router;
