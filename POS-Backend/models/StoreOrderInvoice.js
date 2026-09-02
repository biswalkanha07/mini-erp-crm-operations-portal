const mongoose = require('mongoose');

const storeOrderInvoiceSchema = new mongoose.Schema({
  invoiceNo: { type: String, required: true, unique: true },
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
  dateTime: { type: Date, default: Date.now },
  dueDate: { type: Date },
  status: { type: String, enum: ['pending', 'fulfilled'], default: 'pending' },
  notes: { type: String },
  // Store and organization display fields
  storeName: { type: String },
  storeAddress: { type: String },
  organizationName: { type: String },
  gstNumber: { type: String },
  phoneNumber: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('StoreOrderInvoice', storeOrderInvoiceSchema);
