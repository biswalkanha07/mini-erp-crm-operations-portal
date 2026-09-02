const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  userId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  userType: { type: String, enum: ['organization', 'store'], required: true },
  role: { type: String, enum: ['admin', 'manager', 'cashier'], default: 'cashier' },
  organizationId: { type: String, ref: 'Organization', required: function() { return this.userType === 'organization'; } },
  storeId: { type: String, ref: 'Store', required: function() { return this.userType === 'store'; } },
  permissions: [{
    module: { type: String, enum: ['organization', 'store', 'inventory', 'pos', 'reports'] },
    actions: [{ type: String, enum: ['read', 'write', 'delete', 'manage'] }]
  }],
  status: { type: String, enum: ['active', 'inactive', 'pending'], default: 'active' },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  signupToken: { type: String },
  signupTokenExpires: { type: Date }
},{ timestamps: true, _id: false });

module.exports = mongoose.model('User', userSchema);
