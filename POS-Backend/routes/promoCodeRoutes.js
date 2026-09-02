const express = require('express');
const router = express.Router();
const promoCodeController = require('../controllers/promoCodeController');

// TODO: Add authentication middleware as needed

// Admin/Org CRUD
router.post('/', promoCodeController.createPromoCode);
router.get('/', promoCodeController.getPromoCodes);
router.put('/:id', promoCodeController.updatePromoCode);
router.delete('/:id', promoCodeController.deletePromoCode);

// POS: Validate/apply promo code
router.post('/apply', promoCodeController.applyPromoCode);

module.exports = router;
