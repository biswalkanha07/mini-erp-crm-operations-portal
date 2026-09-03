/**
 * Store Price Routes
 * Phase 4 - Mini ERP + CRM Operations Portal
 */

import { Router, Request, Response } from 'express';
import storeService from '../services/storeService';
import auth from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();

// Get all prices for a store - all authenticated roles
router.get('/:storeId', auth, async (req: Request, res: Response) => {
  try {
    const prices = await storeService.listStorePrices(req.params.storeId);
    res.json(prices);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update profit margin for a store-product - Admin and Sales
router.put('/:storeId/:sku', auth, requireRole('Admin', 'Sales'), async (req: Request, res: Response) => {
  try {
    const { marginType, marginValue, basePrice, overridePrice } = req.body || {};
    const price = await storeService.upsertStorePrice(req.params.storeId, req.params.sku, {
      marginType, marginValue, basePrice, overridePrice
    });
    res.json(price);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
