const Store = require('../models/Store');
const mongoose = require('mongoose');
const User = require('../models/User');
const { generateNextStoreId } = require('../utils/storeIdGenerator');
const crypto = require('crypto');
const { sendStoreSignupEmail } = require('../utils/emailService');
const StorePrice = require('../models/StorePrice');
const Catalogue = require('../models/Catalogue');

exports.createStore = async (req, res) => {
  try {
    const storeData = { ...req.body };

    // Normalize email early
    if (storeData.email && typeof storeData.email === 'string') {
      storeData.email = storeData.email.trim().toLowerCase();
    }

    // 1) Pre-check: email must be unused
    if (!storeData.email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    const existingUser = await User.findOne({ email: storeData.email });

    // 2) Generate storeId
    const storeId = await generateNextStoreId();
    storeData.storeId = storeId;
    storeData._id = storeId;

    // 3) Start transaction for atomic create
    const session = await mongoose.startSession();
    let store, user;
    try {
      await session.withTransaction(async () => {
        // Create and save the store within the transaction
        store = new Store(storeData);
        await store.save({ session });

        if (existingUser) {
          // If user exists
          if (existingUser.status === 'active') {
            // Abort by throwing to rollback and handle below
            const err = new Error('Email already exists');
            err.httpStatus = 409;
            throw err;
          }

          // status is pending: link store to existing user if not already
          existingUser.name = existingUser.name || storeData.contactPersonName;
          existingUser.userType = 'store';
          existingUser.role = existingUser.role || 'manager';
          existingUser.storeId = existingUser.storeId || storeId;
          existingUser.organizationId = existingUser.organizationId || storeData.organizationId;
          // Keep status pending
          // Generate signup token (1 hour expiry)
          existingUser.signupToken = crypto.randomBytes(32).toString('hex');
          existingUser.signupTokenExpires = new Date(Date.now() + 60 * 60 * 1000);
          await existingUser.save({ session });
          user = existingUser;
        } else {
          // Create a new pending user for the store
          const userId = `USER_${storeId}_${Date.now()}`;
          const userData = {
            _id: userId,
            userId: userId,
            name: storeData.contactPersonName,
            email: storeData.email,
            password: 'TEMP_PASSWORD_PENDING_SETUP',
            userType: 'store',
            role: 'manager',
            storeId: storeId,
            organizationId: storeData.organizationId,
            status: 'pending',
            permissions: [
              { module: 'store', actions: ['read', 'write', 'manage'] },
              { module: 'inventory', actions: ['read', 'write', 'manage'] },
              { module: 'pos', actions: ['read', 'write', 'manage'] },
              { module: 'reports', actions: ['read'] }
            ],
            signupToken: crypto.randomBytes(32).toString('hex'),
            signupTokenExpires: new Date(Date.now() + 60 * 60 * 1000)
          };
  
          user = new User(userData);
          await user.save({ session });
        }
      });
    } finally {
      session.endSession();
    }

    // 4) After commit, send signup email
    const frontendUrl = process.env.FRONTEND_URL || 'https://pos.hutechsolutions.in/';
    const signupLink = `${frontendUrl}/signup?storeId=${storeId}&token=${user.signupToken}`;
    const emailResult = await sendStoreSignupEmail(
      storeData.email,
      storeId,
      storeData.storeName,
      storeData.contactPersonName,
      signupLink
    );
    if (!emailResult.success) {
      console.error('Failed to send signup email:', emailResult.error);
    }

    return res.status(201).json({
      success: true,
      message: 'Store created successfully. Signup email sent to store contact.',
      store: {
        storeId: store.storeId,
        storeName: store.storeName,
        storeLocation: store.storeLocation,
        contactPersonName: store.contactPersonName,
        email: store.email,
        status: store.status
      },
      user: {
        userId: user.userId,
        name: user.name,
        email: user.email,
        status: user.status,
        role: user.role
      },
      signupLink: signupLink,
      emailSent: emailResult.success
    });

  } catch (err) {
    console.error('Error creating store:', err);

    if (err.httpStatus === 409) {
      return res.status(409).json({ status: 'error', message: 'Email already exists' });
    }

    if (err.code === 11000) {
      return res.status(400).json({
        error: 'Duplicate key error',
        details: err.keyPattern
      });
    }

    if (err.name === 'ValidationError') {
      const validationErrors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({
        error: 'Validation failed',
        details: validationErrors
      });
    }

    return res.status(500).json({
      error: 'Internal server error while creating store',
      message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
  }
};

// controllers/storeController.js

exports.searchAndFilterStores = async (req, res) => {
  try {
    const { search, status, organizationId, theme, minGst, maxGst, fromDate, toDate } = req.query;

    const query = {};

    // 🔎 Search across multiple fields
    if (search) {
      const regex = new RegExp(search, "i"); // case-insensitive
      query.$or = [
        { storeName: regex },
        { storeId: regex },
        { storeLocation: regex },
        { "address.addressLine1": regex },
        { "address.city": regex },
        { contactPersonName: regex },
        { contactNumber: regex },
        { email: regex }
      ];
    }

    // 🎯 Filters
    if (status) query.status = status;
    if (organizationId) query.organizationId = organizationId;
    if (theme) query.theme = theme;

    // Removed gstRate filtering as GST is now per product

    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) query.createdAt.$gte = new Date(fromDate);
      if (toDate) query.createdAt.$lte = new Date(toDate);
    }

    // ✅ Fetch stores
    const stores = await Store.find(query).sort({ createdAt: -1 });

    return res.json({ success: true, count: stores.length, data: stores });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};


exports.getAllStores = async (req, res) => {
  try {
    const stores = await Store.find().sort({ createdAt: -1 });
    res.json(stores);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getStoreById = async (req, res) => {
  try {
    const store = await Store.findById(req.params.id);
    if (!store) return res.status(404).json({ error: 'Not found' });
    res.json(store);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateStoreById = async (req, res) => {
  try {
    const store = await Store.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!store) return res.status(404).json({ error: 'Not found' });
    res.json(store);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteStoreById = async (req, res) => {
  try {
    const store = await Store.findByIdAndDelete(req.params.id);
    if (!store) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get or compute effective price for a SKU for a store
exports.getEffectivePrice = async (req, res) => {
  try {
    const { storeId, sku } = req.params;
    const catalogue = await Catalogue.findOne({ sku });
    if (!catalogue) return res.status(404).json({ error: 'Product not found' });
    const override = await StorePrice.findOne({ storeId, sku, status: 'active' });
    const base = Number(catalogue.price) || 0;
    let effective = base;
    if (override) {
      if (typeof override.overridePrice === 'number') {
        effective = Number(override.overridePrice);
      } else {
        const margin = Number(override.marginValue) || 0;
        effective = override.marginType === 'absolute' ? base + margin : base + (base * margin / 100);
      }
    } else {
      // Fallback to store-wide profit margin if no per-SKU override
      const store = await Store.findById(storeId);
      const storeMargin = Number(store?.profitMarginPercent) || 0;
      effective = base + (base * storeMargin / 100);
    }
    return res.json({ sku, basePrice: base, effectivePrice: effective });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Upsert store price record
exports.upsertStorePrice = async (req, res) => {
  try {
    const { storeId, sku } = req.params;
    const payload = req.body || {};
    const catalogue = await Catalogue.findOne({ sku });
    const base = Number(catalogue?.price) || 0;
    const update = {
      basePrice: typeof payload.basePrice === 'number' ? payload.basePrice : base,
      marginType: payload.marginType || 'percent',
      marginValue: typeof payload.marginValue === 'number' ? payload.marginValue : 0,
      overridePrice: typeof payload.overridePrice === 'number' ? payload.overridePrice : undefined,
      status: payload.status || 'active'
    };
    const record = await StorePrice.findOneAndUpdate(
      { storeId, sku },
      update,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    return res.json(record);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

// List store prices
exports.listStorePrices = async (req, res) => {
  try {
    const { storeId } = req.params;
    const { sku } = req.query;
    const query = { storeId };
    if (sku) query.sku = sku;
    const items = await StorePrice.find(query).sort({ updatedAt: -1 });
    return res.json(items);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
