/**
 * Invoice Routes
 * Phase 4 - Mini ERP + CRM Operations Portal
 */

import { Router } from 'express';
import * as invoiceController from '../controllers/invoiceController';
import auth from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();

// Invoice routes
router.post('/generate', auth, requireRole('Admin', 'Accounts', 'Sales', 'cashier', 'manager'), invoiceController.generateInvoice);
router.get('/', auth, requireRole('Admin', 'Accounts', 'Sales', 'manager', 'cashier'), invoiceController.getAllInvoices);
router.get('/:id', auth, requireRole('Admin', 'Accounts', 'Sales', 'manager', 'cashier'), invoiceController.getInvoiceById);
router.get('/store/:storeId', auth, requireRole('Admin', 'Accounts', 'Sales', 'manager', 'cashier'), invoiceController.getInvoicesByStore);

// Send invoice SMS
router.post('/send-sms', auth, invoiceController.sendInvoiceSMS);

export default router;
