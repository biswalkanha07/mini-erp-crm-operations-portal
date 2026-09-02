// Send invoice SMS for POS invoice
const { sendInvoiceSMS: sendSMSUtil } = require('../utils/smsService');
exports.sendInvoiceSMS = async (req, res) => {
  try {
    const { invoiceId } = req.body;
    console.log('[SMS] Received invoiceId:', invoiceId);
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      console.error('[SMS] Invoice not found for ID:', invoiceId);
      return res.status(404).json({ error: 'Invoice not found' });
    }
    const mobile = invoice.customerDetails?.phone;
    if (!mobile) {
      console.error('[SMS] Customer mobile not found in invoice:', invoice);
      return res.status(400).json({ error: 'Customer mobile not found in invoice' });
    }
  const invoiceLink = `https://pos.hutechsolutions.in/invoice/${invoice._id}`;
  const message = `Thank you for your purchase! Invoice No: ${invoice.invoiceNo}, Total: ₹${invoice.totalAmount}. View/download: ${invoiceLink}`;
    try {
      const smsResult = await sendSMSUtil(mobile, message);
      console.log('[SMS] Twilio response:', smsResult);
      res.json({ success: true });
    } catch (smsErr) {
      console.error('[SMS] Twilio error:', smsErr);
      res.status(500).json({ error: smsErr.message || 'Twilio SMS failed' });
    }
  } catch (err) {
    console.error('[SMS] General error:', err);
    res.status(500).json({ error: err.message });
  }
};
const Invoice = require('../models/Invoice');
const Sale = require('../models/Sale');
const Store = require('../models/Store');
const Organization = require('../models/Organization');

// Generate invoice from transaction
exports.generateInvoice = async (req, res) => {
  try {
    const { transactionId } = req.body;
    const transaction = await Sale.findById(transactionId).populate('storeId');
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const store = await Store.findById(transaction.storeId);
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    const organization = await Organization.findById(store.organizationId);
    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    const invoiceNo = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    const storeGstRate = 0;
    let gstTotal = 0;
    const recalculatedItems = transaction.items.map((item) => {
      const quantity = Number(item.quantity) || 0;
      const price = Number(item.pricePerUnit) || 0;
      const itemSubTotal = quantity * price;
      const itemDiscount = Number(item.discount) || 0;
      // Prefer gstRate from transaction item; if missing, try fetching from Catalogue; else 0
      let effectiveGstRate = (typeof item.gstRate === 'number' && !Number.isNaN(Number(item.gstRate))) ? Number(item.gstRate) : null;
      if (effectiveGstRate === null) {
        const found = require('../models/Catalogue');
        // Note: synchronous require; use cached model
        // We cannot await here in map; do a simple fallback to 0 for now. We'll adjust below with Promise.all if needed.
      }
      if (effectiveGstRate === null) effectiveGstRate = storeGstRate;
      const itemGst = ((itemSubTotal - itemDiscount) * effectiveGstRate) / 100;
      gstTotal += itemGst;
      const itemTotal = itemSubTotal - itemDiscount + itemGst;
      return {
        sku: item.sku,
        itemName: item.itemName,
        quantity,
        pricePerUnit: price,
        gst: itemGst,
        discount: itemDiscount,
        totalAmount: itemTotal
      };
    });

    const subTotal = recalculatedItems.reduce((sum, item) => sum + (item.quantity * item.pricePerUnit), 0);
    const discountTotal = recalculatedItems.reduce((sum, item) => sum + (Number(item.discount) || 0), 0);
    const grandTotal = subTotal - discountTotal + gstTotal;

    if (!isFinite(grandTotal)) {
      return res.status(400).json({ error: 'Invoice validation failed: totalAmount is invalid' });
    }

    const invoiceData = {
      invoiceNo,
      transactionId: transaction._id,
      storeId: transaction.storeId,
      organizationId: store.organizationId,
      items: recalculatedItems,
      totalAmount: grandTotal,
      gstTotal,
      paymentMode: transaction.paymentMethod,
      qrCodeUrl: transaction.paymentMethod === 'UPI' ? generateUPIQR(organization, grandTotal) : null,
      dateTime: transaction.dateTime,
      customerDetails: transaction.customerDetails,
      status: 'paid',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      storeName: store.storeName,
      storeAddress: store.storeAddress,
      organizationName: organization.organizationName,
      gstNumber: organization.gstNumber,
      phoneNumber: organization.contactNumber
    };

    const invoice = new Invoice(invoiceData);
    await invoice.save();

    return res.status(201).json({
      message: 'Invoice generated successfully',
      invoiceNo,
      invoice
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

// Get all invoices
exports.getAllInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find()
      .populate('transactionId')
      .populate('storeId')
      .populate('organizationId');
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get invoice by ID
exports.getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('transactionId')
      .populate('storeId')
      .populate('organizationId');
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json(invoice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get invoices by store
exports.getInvoicesByStore = async (req, res) => {
  try {
    const { storeId } = req.params;
    const invoices = await Invoice.find({ storeId })
      .populate('transactionId')
      .populate('storeId')
      .populate('organizationId');
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Generate UPI QR code URL (mock implementation)
function generateUPIQR(organization, amount) {
  // This would typically generate a UPI QR code
  // For now, returning a mock URL
  return `https://upiqr.in/pay?pa=${organization.gstNumber}@paytm&pn=${organization.organizationName}&am=${amount}&cu=INR`;
}

