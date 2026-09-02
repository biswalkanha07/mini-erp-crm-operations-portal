require('dotenv').config();
const { query } = require('../db/index');

async function migrateInventorySchema() {
  console.log('=== RUNNING PHASE 5 INVENTORY SCHEMA VERIFICATION ===\n');

  // 1. Check existing product count
  const countBefore = await query('SELECT COUNT(*) AS count FROM products');
  console.log(`Product count before migration: ${countBefore.rows[0].count}`);

  // 2. Ensure columns exist with safe defaults
  await query(`
    ALTER TABLE products 
    ADD COLUMN IF NOT EXISTS minimum_stock INTEGER NOT NULL DEFAULT 0;
  `);

  await query(`
    ALTER TABLE products 
    ADD COLUMN IF NOT EXISTS warehouse_location VARCHAR(100) DEFAULT 'Main Warehouse';
  `);

  // Ensure default values are populated for any nulls
  await query(`
    UPDATE products 
    SET warehouse_location = 'Main Warehouse' 
    WHERE warehouse_location IS NULL;
  `);

  await query(`
    UPDATE products 
    SET minimum_stock = 0 
    WHERE minimum_stock IS NULL;
  `);

  // 3. Create helpful indexes
  await query('CREATE INDEX IF NOT EXISTS idx_products_min_stock ON products(minimum_stock);');
  await query('CREATE INDEX IF NOT EXISTS idx_products_warehouse ON products(warehouse_location);');
  await query('CREATE INDEX IF NOT EXISTS idx_products_name ON products(product_name);');

  // 4. Verify count after migration
  const countAfter = await query('SELECT COUNT(*) AS count FROM products');
  console.log(`Product count after migration: ${countAfter.rows[0].count}`);

  if (parseInt(countBefore.rows[0].count, 10) !== parseInt(countAfter.rows[0].count, 10)) {
    throw new Error('Product count mismatch after migration!');
  }

  console.log('Inventory schema verified and enhanced successfully.');
  process.exit(0);
}

migrateInventorySchema().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});
