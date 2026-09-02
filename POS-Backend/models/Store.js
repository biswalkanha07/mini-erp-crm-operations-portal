const mongoose = require('mongoose');


const storeSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  storeId: { type: String, required: true, unique: true },
  storeName: { type: String, required: true },
  storeLocation: { type: String, required: true },
  address: {
    addressLine1: { type: String, required: true },
    addressLine2: { type: String },
    landmark: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
    pincode: { type: String, required: true, match: /^\d{6}$/ }
  },
  contactPersonName: { type: String, required: true },
  contactNumber: { type: String, required: true, match: /^\d{10}$/ },
  email: { type: String, required: true },
  storePicture: { type: String },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  organizationId: { type: String, ref: 'Organization', required: true },
  discountRate: { type: Number, default: 0 },
  profitMarginPercent: { type: Number, default: 0 },
  theme: { type: String, enum: ['light', 'dark'], default: 'light' },
  bankDetails: {
    bankName: { type: String },
    accountHolderName: { type: String },
    accountNumber: { type: String },
    ifscCode: { type: String, match: /^[A-Z]{4}0[A-Z0-9]{6}$/ },
    branchName: { type: String },
    upiId: { type: String }
  }
}, { timestamps: true, _id: false });

module.exports = mongoose.model('Store', storeSchema);
