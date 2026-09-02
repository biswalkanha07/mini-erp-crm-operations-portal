require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://aniketkuanar2001:aniketkuanar2001@cluster0.kvpotek.mongodb.net/POS?retryWrites=true&w=majority';
const backupDir = path.join(__dirname, '..', 'data-backup');

async function backup() {
  console.log('[Backup] Starting MongoDB data backup...');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  await mongoose.connect(MONGO_URI);
  console.log('[Backup] Connected to MongoDB Atlas.');

  const collections = await mongoose.connection.db.listCollections().toArray();
  const manifest = {};

  for (const c of collections) {
    const docs = await mongoose.connection.db.collection(c.name).find({}).toArray();
    const filePath = path.join(backupDir, `${c.name}.json`);
    fs.writeFileSync(filePath, JSON.stringify(docs, null, 2), 'utf8');
    manifest[c.name] = docs.length;
    console.log(`[Backup] Exported ${docs.length} documents from '${c.name}' -> ${filePath}`);
  }

  const manifestPath = path.join(backupDir, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify({
    exportedAt: new Date().toISOString(),
    collections: manifest
  }, null, 2), 'utf8');

  console.log('[Backup] Backup completed successfully. Manifest written to manifest.json.');
  await mongoose.disconnect();
}

backup().catch((err) => {
  console.error('[Backup] Backup failed:', err.message);
  process.exit(1);
});
