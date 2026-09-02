const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController');
const auth = require('../middleware/auth');

// Test endpoint to see sales data
router.get('/test-sales/:storeId', auth, reportsController.testSalesData);

// Get customer reports for a specific store
router.get('/customers/:storeId', auth, reportsController.getCustomerReports);

// Get top customers for a store
router.get('/top-customers/:storeId', auth, reportsController.getTopCustomers);

// Get customer purchase history
router.get('/customer-history/:storeId', auth, reportsController.getCustomerPurchaseHistory);

module.exports = router;
