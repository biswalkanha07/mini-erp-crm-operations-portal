const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  _id: { type: String, required: true },
  categoryId: { type: String, required: true },
  categoryName: { type: String, required: true },
  categoryDescription: { type: String },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  organizationId: { type: String, ref: 'Organization', required: true }
}, { timestamps: true, _id: false });

// Compound index to ensure categoryId is unique within an organization
categorySchema.index({ categoryId: 1, organizationId: 1 }, { unique: true });

module.exports = mongoose.model('Category', categorySchema);
