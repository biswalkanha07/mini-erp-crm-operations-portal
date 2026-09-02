const express = require('express');
const router = express.Router();
const StorePrice = require('../models/StorePrice');

// Get all prices for a store
router.get('/:storeId', async (req, res) => {
  try {
    const prices = await StorePrice.find({ storeId: req.params.storeId });
    res.json(prices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update profit margin for a store-product
router.put('/:storeId/:sku', async (req, res) => {
  try {
    const { marginType, marginValue } = req.body;
    const price = await StorePrice.findOneAndUpdate(
      { storeId: req.params.storeId, sku: req.params.sku },
      { marginType, marginValue },
      { new: true, upsert: true }
    );
    res.json(price);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
