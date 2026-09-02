const promoCodeService = require('../services/promoCodeService');

// Create a new promo code
exports.createPromoCode = async (req, res) => {
  try {
    const promo = await promoCodeService.create(req.body);
    res.status(201).json(promo);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get all promo codes (optionally filter by organization)
exports.getPromoCodes = async (req, res) => {
  try {
    const promos = await promoCodeService.getAll(req.query.organization);
    res.json(promos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update a promo code
exports.updatePromoCode = async (req, res) => {
  try {
    const promo = await promoCodeService.update(req.params.id, req.body);
    if (!promo) return res.status(404).json({ error: 'Promo code not found' });
    res.json(promo);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete a promo code
exports.deletePromoCode = async (req, res) => {
  try {
    const promo = await promoCodeService.delete(req.params.id);
    if (!promo) return res.status(404).json({ error: 'Promo code not found' });
    res.json({ message: 'Promo code deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Validate and apply promo code (for POS)
exports.applyPromoCode = async (req, res) => {
  try {
    const result = await promoCodeService.applyPromoCode(req.body);
    res.json(result);
  } catch (err) {
    if (err.httpStatus === 404) {
      return res.status(404).json({ error: err.message });
    }
    res.status(400).json({ error: err.message });
  }
};
