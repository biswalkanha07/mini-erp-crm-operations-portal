const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const auth = require('../middleware/auth');

// Store creates order
router.post('/', auth, orderController.createOrder);
// Store gets own orders
router.get('/my', auth, orderController.getStoreOrders);
// Admin gets all orders
router.get('/', auth, orderController.getAllOrders);
// Admin updates order status
router.patch('/:id', auth, orderController.updateOrderStatus);

module.exports = router;
