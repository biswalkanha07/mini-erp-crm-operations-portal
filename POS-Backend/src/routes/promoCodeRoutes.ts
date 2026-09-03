/**
 * Promo Code Routes
 * Phase 4 - Mini ERP + CRM Operations Portal
 */

import { Router } from 'express';
import * as promoCodeController from '../controllers/promoCodeController';
import auth from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();

// Read promo codes - all authenticated roles
router.get('/', auth, promoCodeController.getPromoCodes);

// Validate/apply promo code for POS transactions
router.post('/apply', auth, promoCodeController.applyPromoCode);

// Modify promo codes
router.post('/', auth, requireRole('Admin', 'Sales'), promoCodeController.createPromoCode);
router.put('/:id', auth, requireRole('Admin', 'Sales'), promoCodeController.updatePromoCode);
router.delete('/:id', auth, requireRole('Admin'), promoCodeController.deletePromoCode);

export default router;
