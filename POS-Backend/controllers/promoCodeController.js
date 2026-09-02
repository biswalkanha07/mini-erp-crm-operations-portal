const PromoCode = require('../models/PromoCode');

// Create a new promo code
exports.createPromoCode = async (req, res) => {
  try {
    const promo = new PromoCode(req.body);
    await promo.save();
    res.status(201).json(promo);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get all promo codes (optionally filter by organization)
exports.getPromoCodes = async (req, res) => {
  try {
    const filter = req.query.organization ? { organization: req.query.organization } : {};
    const promos = await PromoCode.find(filter);
    res.json(promos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update a promo code
exports.updatePromoCode = async (req, res) => {
  try {
    const promo = await PromoCode.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!promo) return res.status(404).json({ error: 'Promo code not found' });
    res.json(promo);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete a promo code
exports.deletePromoCode = async (req, res) => {
  try {
    const promo = await PromoCode.findByIdAndDelete(req.params.id);
    if (!promo) return res.status(404).json({ error: 'Promo code not found' });
    res.json({ message: 'Promo code deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Validate and apply promo code (for POS)
exports.applyPromoCode = async (req, res) => {
  try {
    const { code, organization, orderTotal } = req.body;
    const promo = await PromoCode.findOne({ code, organization, isActive: true });
    if (!promo) return res.status(404).json({ error: 'Invalid or expired promo code' });
    if (promo.expiryDate && new Date() > promo.expiryDate) return res.status(400).json({ error: 'Promo code expired' });
    if (promo.usageLimit && promo.usedCount >= promo.usageLimit) return res.status(400).json({ error: 'Promo code usage limit reached' });

    let discountAmount = 0;
    const total = typeof orderTotal === 'number' ? orderTotal : Number(orderTotal);
    if (promo.discountType === 'percentage') {
      discountAmount = total * (promo.discountValue / 100);
    } else if (promo.discountType === 'fixed') {
      discountAmount = promo.discountValue;
    }
    // Ensure discount does not exceed total
    if (discountAmount > total) discountAmount = total;

    res.json({ discountAmount, promo });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
