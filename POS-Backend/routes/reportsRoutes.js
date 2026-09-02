const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

// Customer and store reports
router.get('/test-sales/:storeId', auth, requireRole('Admin', 'Accounts', 'Sales', 'manager', 'cashier'), reportsController.testSalesData);
router.get('/customers/:storeId', auth, requireRole('Admin', 'Accounts', 'Sales', 'manager', 'cashier'), reportsController.getCustomerReports);
router.get('/top-customers/:storeId', auth, requireRole('Admin', 'Accounts', 'Sales', 'manager', 'cashier'), reportsController.getTopCustomers);
router.get('/customer-history/:storeId', auth, requireRole('Admin', 'Accounts', 'Sales', 'manager', 'cashier'), reportsController.getCustomerPurchaseHistory);

module.exports = router;
