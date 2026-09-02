const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');


// Invoice routes
router.post('/generate', invoiceController.generateInvoice);
router.get('/', invoiceController.getAllInvoices);
router.get('/:id', invoiceController.getInvoiceById);
router.get('/store/:storeId', invoiceController.getInvoicesByStore);

// Send invoice SMS for POS invoice
const auth = require('../middleware/auth');
router.post('/send-sms', auth, invoiceController.sendInvoiceSMS);

module.exports = router;

