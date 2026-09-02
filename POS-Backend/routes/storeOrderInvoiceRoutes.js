const express = require('express');
const router = express.Router();
const StoreOrderInvoice = require('../models/StoreOrderInvoice');
const auth = require('../middleware/auth');

// Get store order invoice by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const invoice = await StoreOrderInvoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json(invoice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Send invoice SMS to customer
const orderController = require('../controllers/orderController');
router.post('/send-sms', auth, orderController.sendInvoiceSMS);

module.exports = router;
