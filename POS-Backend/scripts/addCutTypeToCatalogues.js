require('dotenv').config();
const mongoose = require('mongoose');
const Catalogue = require('../models/Catalogue');

async function run() {
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/POS';
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to MongoDB');

  // Set missing cutType to empty string so UI can update later
  const res = await Catalogue.updateMany(
    { $or: [ { cutType: { $exists: false } }, { cutType: { $eq: null } } ] },
    { $set: { cutType: '' } }
  );
  console.log(`Updated ${res.modifiedCount || res.nModified || 0} catalogue documents to include cutType`);
  await mongoose.disconnect();
}

run().catch(err => {
  console.error('Script failed:', err);
  process.exit(1);
});


