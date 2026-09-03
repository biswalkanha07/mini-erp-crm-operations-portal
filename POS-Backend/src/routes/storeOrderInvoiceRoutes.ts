/**
 * Store Order Invoice Routes
 * Phase 4 - Mini ERP + CRM Operations Portal
 */

import { Router, Request, Response } from 'express';
import orderService from '../services/orderService';
import auth from '../middleware/auth';
import * as orderController from '../controllers/orderController';

const router = Router();

// Get store order invoice by ID
router.get('/:id', auth, async (req: Request, res: Response) => {
  try {
    const invoice = await orderService.getStoreOrderInvoiceById(req.params.id);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json(invoice);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Send invoice SMS to customer
router.post('/send-sms', auth, orderController.sendInvoiceSMS);

export default router;
