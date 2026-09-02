const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

// Dashboard routes
router.get('/stats', dashboardController.getStats);
router.get('/monthly-sales', dashboardController.getMonthlySales);
router.get('/most-sold-products', dashboardController.getMostSoldProducts);
router.get('/sales-trend', dashboardController.getSalesTrend);
router.get('/profit-data', dashboardController.getProfitData);
router.get('/customer-stats', dashboardController.getCustomerStats);
router.get('/inventory-stats', dashboardController.getInventoryStats);
router.get('/sales-by-store', dashboardController.getSalesByStore);

module.exports = router;
