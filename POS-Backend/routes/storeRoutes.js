const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');
const storeDashboardController = require('../controllers/storeDashboardController');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

// Store listing and search
router.get('/search', auth, storeController.searchAndFilterStores);
router.get('/', auth, storeController.getAllStores);
router.get('/:id', auth, storeController.getStoreById);

// Store management - restricted to Admin
router.post('/', auth, requireRole('Admin'), storeController.createStore);
router.put('/:id', auth, requireRole('Admin'), storeController.updateStoreById);
router.delete('/:id', auth, requireRole('Admin'), storeController.deleteStoreById);

// Store pricing overrides
router.get('/:storeId/prices', auth, storeController.listStorePrices);
router.get('/:storeId/prices/:sku/effective', auth, storeController.getEffectivePrice);
router.put('/:storeId/prices/:sku', auth, requireRole('Admin', 'Sales'), storeController.upsertStorePrice);

// Store dashboard (Admin, Accounts, and store managers/cashiers)
router.get('/:storeId/dashboard/stats', auth, storeDashboardController.getStoreStats);
router.get('/:storeId/dashboard/monthly-sales', auth, storeDashboardController.getStoreMonthlySales);
router.get('/:storeId/dashboard/payment-split', auth, storeDashboardController.getStorePaymentSplit);
router.get('/:storeId/dashboard/top-products', auth, storeDashboardController.getStoreTopProducts);

module.exports = router;
