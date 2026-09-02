const mongoose = require('mongoose');

const storePriceSchema = new mongoose.Schema({
  storeId: { type: String, ref: 'Store', required: true, index: true },
  sku: { type: String, required: true, index: true },
  basePrice: { type: Number },
  marginType: { type: String, enum: ['percent', 'absolute'], default: 'percent' },
  marginValue: { type: Number, default: 0 },
  overridePrice: { type: Number },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, { timestamps: true });

storePriceSchema.index({ storeId: 1, sku: 1 }, { unique: true });

module.exports = mongoose.model('StorePrice', storePriceSchema);


