const invoiceService = require('../services/invoiceService');
const { sendInvoiceSMS: sendSMSUtil } = require('../utils/smsService');

// Send invoice SMS for POS invoice
exports.sendInvoiceSMS = async (req, res) => {
  try {
    const { invoiceId } = req.body;
    const invoice = await invoiceService.getById(invoiceId);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    const mobile = invoice.customerDetails?.phone;
    if (!mobile) {
      return res.status(400).json({ error: 'Customer mobile not found in invoice' });
    }
    const invoiceLink = `https://pos.hutechsolutions.in/invoice/${invoice._id}`;
    const message = `Thank you for your purchase! Invoice No: ${invoice.invoiceNo}, Total: ₹${invoice.totalAmount}. View/download: ${invoiceLink}`;
    try {
      await sendSMSUtil(mobile, message);
      res.json({ success: true });
    } catch (smsErr) {
      console.error('[SMS] Twilio error:', smsErr);
      res.status(500).json({ error: smsErr.message || 'Twilio SMS failed' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Generate invoice from transaction
exports.generateInvoice = async (req, res) => {
  try {
    const { transactionId } = req.body;
    const invoice = await invoiceService.generateInvoiceFromTransaction(transactionId);
    return res.status(201).json({
      message: 'Invoice generated successfully',
      invoiceNo: invoice.invoiceNo,
      invoice
    });
  } catch (err) {
    if (err.httpStatus === 404) {
      return res.status(404).json({ error: err.message });
    }
    return res.status(400).json({ error: err.message });
  }
};

// Get all invoices
exports.getAllInvoices = async (req, res) => {
  try {
    const invoices = await invoiceService.getAll();
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get invoice by ID
exports.getInvoiceById = async (req, res) => {
  try {
    const invoice = await invoiceService.getById(req.params.id);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json(invoice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get invoices by store
exports.getInvoicesByStore = async (req, res) => {
  try {
    const invoices = await invoiceService.getByStore(req.params.storeId);
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
