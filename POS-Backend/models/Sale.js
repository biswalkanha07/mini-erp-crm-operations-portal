const mongoose = require('mongoose');

const salesSchema = new mongoose.Schema({
  transactionId: { type: String, required: true, unique: true },
  storeId: { type: String, ref: 'Store', required: true },
  items: [{
    sku: { type: String, required: true },
    itemName: { type: String, required: true },
    quantity: { type: Number, required: true },
    pricePerUnit: { type: Number, required: true },
    // gstRate used to compute gst; persisted for accurate invoice recomputation
    gstRate: { type: Number, default: 0 },
    gst: { type: Number, default: 0 }, // GST amount for this item
    discount: { type: Number, default: 0 }, // Discount amount for this item
    totalAmount: { type: Number, required: true } // (quantity * pricePerUnit) - discount + gst
  }],
  subTotal: { type: Number, required: true },
  gstTotal: { type: Number, required: true },
  discountTotal: { type: Number, default: 0 },
  grandTotal: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['cash', 'card', 'UPI'], required: true },
  dateTime: { type: Date, default: Date.now },
  customerDetails: {
    name: String,
    phone: String,
    email: String
  },
  cashier: { type: String, ref: 'User' }
});

module.exports = mongoose.model('Sale', salesSchema);
