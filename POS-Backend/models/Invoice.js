const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  invoiceNo: { type: String, required: true, unique: true },
  transactionId: { type: String, ref: 'Sale', required: true },
  storeId: { type: String, ref: 'Store', required: true },
  organizationId: { type: String, ref: 'Organization', required: true },
  items: [{
    sku: { type: String, required: true },
    itemName: { type: String, required: true },
    quantity: { type: Number, required: true },
    pricePerUnit: { type: Number, required: true },
    gst: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true }
  }],
  totalAmount: { type: Number, required: true },
  paymentMode: { type: String, enum: ['cash', 'card', 'UPI'], required: true },
  qrCodeUrl: { type: String }, // URL for UPI QR code if payment method is UPI
  dateTime: { type: Date, default: Date.now },
  customerDetails: {
    name: String,
    phone: String,
    email: String
  },
  // Additional invoice-specific fields
  dueDate: { type: Date },
  status: { type: String, enum: ['paid', 'pending', 'overdue'], default: 'paid' },
  notes: { type: String },
  // Store and organization display fields
  storeName: { type: String },
  storeAddress: { type: String },
  organizationName: { type: String },
  gstNumber: { type: String },
  phoneNumber: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Invoice', invoiceSchema);

