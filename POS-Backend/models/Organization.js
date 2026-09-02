const mongoose = require('mongoose');


const organizationSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  organizationId: { type: String, required: true, unique: true },
  organizationName: { type: String, required: true },
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
  gstNumber: { type: String, required: true, unique: true },
  panNumber: { type: String, required: true, unique: true },
  logo: { type: String } // URL or path to logo
}, { timestamps: true, _id: false });

module.exports = mongoose.model('Organization', organizationSchema);
``