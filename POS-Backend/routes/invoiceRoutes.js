const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

// Invoice routes
router.post('/generate', auth, requireRole('Admin', 'Accounts', 'Sales', 'cashier', 'manager'), invoiceController.generateInvoice);
router.get('/', auth, requireRole('Admin', 'Accounts', 'Sales', 'manager', 'cashier'), invoiceController.getAllInvoices);
router.get('/:id', auth, requireRole('Admin', 'Accounts', 'Sales', 'manager', 'cashier'), invoiceController.getInvoiceById);
router.get('/store/:storeId', auth, requireRole('Admin', 'Accounts', 'Sales', 'manager', 'cashier'), invoiceController.getInvoicesByStore);

// Send invoice SMS
router.post('/send-sms', auth, invoiceController.sendInvoiceSMS);

module.exports = router;
