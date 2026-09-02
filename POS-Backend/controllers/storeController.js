const storeService = require('../services/storeService');

exports.createStore = async (req, res) => {
  try {
    const result = await storeService.createStore(req.body);
    return res.status(201).json(result);
  } catch (err) {
    console.error('Error creating store:', err);

    if (err.httpStatus === 409) {
      return res.status(409).json({ status: 'error', message: 'Email already exists' });
    }

    if (err.httpStatus === 400 || err.code === '23505') {
      return res.status(400).json({ error: err.message || 'Duplicate key or validation error' });
    }

    return res.status(500).json({
      error: 'Internal server error while creating store',
      message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
  }
};

exports.searchAndFilterStores = async (req, res) => {
  try {
    const stores = await storeService.searchAndFilter(req.query);
    return res.json({ success: true, count: stores.length, data: stores });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.getAllStores = async (req, res) => {
  try {
    const stores = await storeService.getAll(req.query);
    res.json(stores);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getStoreById = async (req, res) => {
  try {
    const store = await storeService.getById(req.params.id);
    if (!store) return res.status(404).json({ error: 'Not found' });
    res.json(store);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateStoreById = async (req, res) => {
  try {
    const store = await storeService.update(req.params.id, req.body);
    if (!store) return res.status(404).json({ error: 'Not found' });
    res.json(store);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteStoreById = async (req, res) => {
  try {
    const store = await storeService.delete(req.params.id);
    if (!store) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.listStorePrices = async (req, res) => {
  try {
    const prices = await storeService.listStorePrices(req.params.storeId);
    res.json(prices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.upsertStorePrice = async (req, res) => {
  try {
    const { marginType, marginValue, basePrice, overridePrice } = req.body;
    const price = await storeService.upsertStorePrice(req.params.storeId, req.params.sku, {
      marginType, marginValue, basePrice, overridePrice
    });
    res.json(price);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getEffectivePrice = async (req, res) => {
  try {
    const { storeId, sku } = req.params;
    const priceData = await storeService.getEffectivePrice(storeId, sku);
    if (!priceData) return res.status(404).json({ error: 'Product not found' });
    res.json(priceData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
