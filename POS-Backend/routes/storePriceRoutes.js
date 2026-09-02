const express = require('express');
const router = express.Router();
const storeService = require('../services/storeService');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

// Get all prices for a store - all authenticated roles
router.get('/:storeId', auth, async (req, res) => {
  try {
    const prices = await storeService.listStorePrices(req.params.storeId);
    res.json(prices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update profit margin for a store-product - Admin and Sales
router.put('/:storeId/:sku', auth, requireRole('Admin', 'Sales'), async (req, res) => {
  try {
    const { marginType, marginValue, basePrice, overridePrice } = req.body;
    const price = await storeService.upsertStorePrice(req.params.storeId, req.params.sku, {
      marginType, marginValue, basePrice, overridePrice
    });
    res.json(price);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
