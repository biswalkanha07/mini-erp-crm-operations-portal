const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');
const storeDashboardController = require('../controllers/storeDashboardController');

router.post('/', storeController.createStore);
router.get('/search', storeController.searchAndFilterStores);
router.get('/', storeController.getAllStores);
router.get('/:id', storeController.getStoreById);
router.put('/:id', storeController.updateStoreById);
router.delete('/:id', storeController.deleteStoreById);

// Store pricing overrides
router.get('/:storeId/prices', storeController.listStorePrices);
router.get('/:storeId/prices/:sku/effective', storeController.getEffectivePrice);
router.put('/:storeId/prices/:sku', storeController.upsertStorePrice);

// Store dashboard
router.get('/:storeId/dashboard/stats', storeDashboardController.getStoreStats);
router.get('/:storeId/dashboard/monthly-sales', storeDashboardController.getStoreMonthlySales);
router.get('/:storeId/dashboard/payment-split', storeDashboardController.getStorePaymentSplit);
router.get('/:storeId/dashboard/top-products', storeDashboardController.getStoreTopProducts);

module.exports = router;
