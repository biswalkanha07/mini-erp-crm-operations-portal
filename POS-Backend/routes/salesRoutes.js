const express = require('express');
const router = express.Router();
const salesController = require('../controllers/salesController');
// console.log(salesController);

// Transaction routes
router.get('/search', salesController.advancedSearch); // Add this BEFORE the generic '/' route
router.get('/', salesController.getAllSales);
router.post('/transaction', salesController.createTransaction);
router.get('/transaction/:id', salesController.getTransactionById);
router.get('/store/:storeId', salesController.getTransactionsByStore);

// Sales filtering and statistics routes
router.get('/date-range', salesController.getSalesByDateRange);
router.get('/transaction-id/:transactionId', salesController.getSalesByTransactionId);
router.get('/stats', salesController.getSalesStats);
//router.get('/today', salesController.getTodaysSales);
router.get('/payment-method/:paymentMethod', salesController.getSalesByPaymentMethod);

// Product lookup routes (for POS interface)
router.get('/product/sku/:sku', salesController.getProductBySKU);
router.get('/product/barcode/:barcode', salesController.getProductByBarcode);

module.exports = router;
