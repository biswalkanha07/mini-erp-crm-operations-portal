const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

// Dashboard routes - protected with RBAC
router.get('/stats', auth, requireRole('Admin', 'Accounts', 'Sales'), dashboardController.getStats);
router.get('/monthly-sales', auth, requireRole('Admin', 'Accounts', 'Sales'), dashboardController.getMonthlySales);
router.get('/most-sold-products', auth, requireRole('Admin', 'Accounts', 'Sales', 'Warehouse'), dashboardController.getMostSoldProducts);
router.get('/sales-trend', auth, requireRole('Admin', 'Accounts', 'Sales'), dashboardController.getSalesTrend);
router.get('/profit-data', auth, requireRole('Admin', 'Accounts'), dashboardController.getProfitData);
router.get('/customer-stats', auth, requireRole('Admin', 'Accounts', 'Sales'), dashboardController.getCustomerStats);
router.get('/inventory-stats', auth, requireRole('Admin', 'Warehouse', 'Accounts', 'Sales'), dashboardController.getInventoryStats);
router.get('/sales-by-store', auth, requireRole('Admin', 'Accounts', 'Sales'), dashboardController.getSalesByStore);
router.get('/overview', auth, requireRole('Admin', 'Sales', 'Warehouse', 'Accounts'), dashboardController.getERPOverview);

module.exports = router;

