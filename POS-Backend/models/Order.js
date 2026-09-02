const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  storeId: { type: String, ref: 'Store', required: true },
  items: [
    {
      sku: { type: String, required: true },
      itemName: { type: String, required: true },
      quantity: { type: Number, required: true }
    }
  ],
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'fulfilled'], default: 'pending' },
  adminNote: { type: String },
  invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);
