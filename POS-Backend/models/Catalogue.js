const mongoose = require('mongoose');

const catalogueSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  itemId: { type: String, required: true },
  sku: { type: String, required: true },
  itemName: { type: String, required: true },
  categoryId: { type: String, ref: 'Category', required: true },
  volumeOfMeasurement: { type: String, required: true }, // e.g., "1kg", "500ml"
  sourceOfOrigin: { type: String },
  nutritionValue: {
    calories: Number,
    protein: Number,
    fat: Number,
    carbs: Number,
    fiber: Number,
    sugar: Number,
    sodium: Number
  },
  certification: { type: String }, // e.g., "FSSAI", "ISO"
  cutType: { type: String, enum: ['', 'Halal', 'Jhatka', 'Kosher', 'Standard Commercial', 'Free-range'], default: '' }, // Optional cut type
  // Optional certification image stored as base64 data URL (or URL)
  certificationImage: { type: String },
  price: { type: Number, required: true },
  stock: { type: Number, default: 0 },
  barcode: { type: String },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  // Deprecated single image field retained for backward compatibility
  image: { type: String }, // image URL or path
  // New: support multiple images
  images: [{ type: String }], // array of image URLs/paths or base64 data URLs
  thumbnail: { type: String }, // thumbnail URL or path (one of images)
  instructions: { type: String },
  expiry: { type: String }, // e.g., '24 hours' or '24 days'
  // Optional per-product GST rate (percent). If absent, store.gstRate is used
  gstRate: { type: Number },
  organizationId: { type: String, ref: 'Organization', required: true }
}, { timestamps: true, _id: false });

// Compound indexes to ensure uniqueness within organization
catalogueSchema.index({ itemId: 1, organizationId: 1 }, { unique: true });
catalogueSchema.index({ sku: 1, organizationId: 1 }, { unique: true });
catalogueSchema.index({ barcode: 1, organizationId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Catalogue', catalogueSchema);
