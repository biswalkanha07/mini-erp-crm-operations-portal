// Migration: Unset gstRate from Store documents and optionally backfill Catalogue gstRate
// Usage: node backend/scripts/addGstRateToStores.js
require('dotenv').config();
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Store = require('../models/Store');
const Catalogue = require('../models/Catalogue');

async function run() {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.DB_URL || 'mongodb://127.0.0.1:27017/pos';
    console.log('Connecting to MongoDB:', mongoUri.replace(/:\/\/[^@]+@/, '://***:***@'));
    await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });

    console.log('Connected. Unsetting Store.gstRate...');
    const res = await Store.updateMany({}, { $unset: { gstRate: '' } });
    console.log('Stores updated:', res.modifiedCount || res.nModified || 0);

    // Optional: If you want to set a default gstRate on Catalogue items, do it here
    // Example: set gstRate = 0 where missing
    console.log('Ensuring Catalogue.gstRate exists (default 0 where missing)...');
    const catRes = await Catalogue.updateMany({ gstRate: { $exists: false } }, { $set: { gstRate: 0 } });
    console.log('Catalogue updated:', catRes.modifiedCount || catRes.nModified || 0);

    await mongoose.disconnect();
    console.log('Migration completed.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

run();


