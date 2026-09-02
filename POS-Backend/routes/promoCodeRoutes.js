const express = require('express');
const router = express.Router();
const promoCodeController = require('../controllers/promoCodeController');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

// Read promo codes - all authenticated roles
router.get('/', auth, promoCodeController.getPromoCodes);

// Validate/apply promo code for POS transactions
router.post('/apply', auth, promoCodeController.applyPromoCode);

// Modify promo codes
router.post('/', auth, requireRole('Admin', 'Sales'), promoCodeController.createPromoCode);
router.put('/:id', auth, requireRole('Admin', 'Sales'), promoCodeController.updatePromoCode);
router.delete('/:id', auth, requireRole('Admin'), promoCodeController.deletePromoCode);

module.exports = router;
